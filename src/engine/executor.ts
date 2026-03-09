import Handlebars from "handlebars";
import { WorkflowStore } from "./workflow-store.js";
import { logger } from "../logger.js";
import { SlackService } from "../services/integrations/slack.service.js";
import { DiscordService } from "../services/integrations/discord.service.js";
import { GitHubService } from "../services/integrations/github.service.js";
import { EmailService } from "../services/integrations/email.service.js";
import type { Workflow, WorkflowStepDef, StepType } from "../types.js";

interface ExecutionContext {
  trigger: Record<string, unknown>;
  [key: string]: unknown;
}

export class Executor {
  constructor(private store: WorkflowStore) {}

  async execute(
    workflow: Workflow,
    triggerPayload: Record<string, unknown> = {},
  ): Promise<string> {
    const run = this.store.createRun(workflow.id, triggerPayload);
    this.store.updateRun(run.id, { status: "running" });

    const ctx: ExecutionContext = { trigger: triggerPayload };

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const stepDef = workflow.steps[i];
        const resolvedConfig = this.resolveTemplates(stepDef.config, ctx);

        const stepRecord = this.store.createRunStep({
          run_id: run.id,
          step_index: i,
          step_name: stepDef.name,
          input: resolvedConfig,
        });
        this.store.updateRunStep(stepRecord.id, { status: "running" });

        try {
          if (stepDef.type === "condition") {
            const passed = this.evalCondition(resolvedConfig);
            if (!passed) {
              this.store.updateRunStep(stepRecord.id, {
                status: "completed",
                output: { skipped: true, reason: "condition false" },
                completed_at: new Date().toISOString(),
              });
              // skip remaining steps
              break;
            }
            this.store.updateRunStep(stepRecord.id, {
              status: "completed",
              output: { passed: true },
              completed_at: new Date().toISOString(),
            });
            ctx[`step${i}`] = { passed: true };
            continue;
          }

          const output = await this.runStep(stepDef.type, resolvedConfig);
          this.store.updateRunStep(stepRecord.id, {
            status: "completed",
            output,
            completed_at: new Date().toISOString(),
          });
          ctx[`step${i}`] = output;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.store.updateRunStep(stepRecord.id, {
            status: "failed",
            error: message,
            completed_at: new Date().toISOString(),
          });
          throw err;
        }
      }

      this.store.updateRun(run.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.store.updateRun(run.id, {
        status: "failed",
        completed_at: new Date().toISOString(),
        error: message,
      });
      logger.error(`Workflow ${workflow.id} run ${run.id} failed: ${message}`);
    }

    return run.id;
  }

  private resolveTemplates(
    config: Record<string, unknown>,
    ctx: ExecutionContext,
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === "string") {
        const template = Handlebars.compile(value, { noEscape: true });
        resolved[key] = template(ctx);
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }

  private evalCondition(config: Record<string, unknown>): boolean {
    const left = String(config.left ?? "");
    const op = String(config.op ?? "==");
    const right = String(config.right ?? "");

    switch (op) {
      case "==":
        return left === right;
      case "!=":
        return left !== right;
      case ">":
        return Number(left) > Number(right);
      case "<":
        return Number(left) < Number(right);
      case ">=":
        return Number(left) >= Number(right);
      case "<=":
        return Number(left) <= Number(right);
      case "contains":
        return left.includes(right);
      default:
        logger.warn(`Unknown condition operator: ${op}`);
        return false;
    }
  }

  private async runStep(
    type: StepType,
    config: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    switch (type) {
      case "clickup_api":
        return this.runClickUpStep(config);
      case "slack":
        return this.runSlackStep(config);
      case "discord":
        return this.runDiscordStep(config);
      case "github":
        return this.runGitHubStep(config);
      case "email":
        return this.runEmailStep(config);
      default:
        throw new Error(`Unknown step type: ${type}`);
    }
  }

  private async runClickUpStep(
    config: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const { default: axios } = await import("axios");
    const { config: appConfig } = await import("../config/app.config.js");
    const action = String(config.action ?? "");
    const endpoint = String(config.endpoint ?? "");
    const method = String(config.method ?? "GET").toUpperCase();
    const body = config.body as Record<string, unknown> | undefined;

    const url = `${appConfig.clickUpApiUrl}${endpoint}`;
    const resp = await axios({
      method,
      url,
      headers: { Authorization: appConfig.clickUpPersonalToken },
      data: body,
    });
    return { status: resp.status, data: resp.data, action };
  }

  private async runSlackStep(
    config: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const service = new SlackService();
    const result = await service.sendMessage(
      String(config.channel),
      String(config.text),
    );
    return { ok: true, ts: result.ts };
  }

  private async runDiscordStep(
    config: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const service = new DiscordService();
    const result = await service.sendWebhookMessage(
      String(config.content),
      config.username as string | undefined,
    );
    return { ok: true, ...result };
  }

  private async runGitHubStep(
    config: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const service = new GitHubService();
    const action = String(config.action ?? "create_issue");

    if (action === "add_comment") {
      const result = await service.addComment(
        String(config.owner),
        String(config.repo),
        Number(config.issue_number),
        String(config.body),
      );
      return { ok: true, comment_id: result.id };
    }

    // default: create_issue
    const result = await service.createIssue(
      String(config.owner),
      String(config.repo),
      String(config.title),
      config.body as string | undefined,
    );
    return { ok: true, issue_number: result.number, url: result.html_url };
  }

  private async runEmailStep(
    config: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const service = new EmailService();
    const result = await service.sendEmail(
      String(config.to),
      String(config.subject),
      String(config.body),
      config.html as string | undefined,
    );
    return { ok: true, messageId: result.messageId };
  }
}
