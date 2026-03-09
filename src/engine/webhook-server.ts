import express from "express";
import crypto from "crypto";
import { WorkflowStore } from "./workflow-store.js";
import { Executor } from "./executor.js";
import { logger } from "../logger.js";

export class WebhookServer {
  private app = express();
  private server: ReturnType<typeof this.app.listen> | null = null;

  constructor(
    private store: WorkflowStore,
    private executor: Executor,
    private port: number,
    private secret: string,
  ) {
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.app.get("/health", (_req, res) => {
      res.json({ status: "ok" });
    });

    this.app.post("/webhook/:workflow_id", (req, res) => {
      const { workflow_id } = req.params;

      const workflow = this.store.getWorkflow(workflow_id);
      if (!workflow) {
        res.status(404).json({ error: "workflow not found" });
        return;
      }
      if (!workflow.enabled) {
        res.status(403).json({ error: "workflow disabled" });
        return;
      }
      if (workflow.trigger_type !== "webhook") {
        res.status(400).json({ error: "workflow is not webhook-triggered" });
        return;
      }

      // HMAC-SHA256 verification
      const sigHeader = req.headers["x-signature"] as string | undefined;
      const workflowSecret =
        (workflow.trigger_config.webhook_secret as string) || this.secret;
      if (workflowSecret) {
        if (!sigHeader) {
          res.status(401).json({ error: "missing signature" });
          return;
        }
        const expected = crypto
          .createHmac("sha256", workflowSecret)
          .update(JSON.stringify(req.body))
          .digest("hex");
        const valid = crypto.timingSafeEqual(
          Buffer.from(sigHeader),
          Buffer.from(expected),
        );
        if (!valid) {
          res.status(401).json({ error: "invalid signature" });
          return;
        }
      }

      const payload = req.body as Record<string, unknown>;
      this.executor
        .execute(workflow, { ...payload, triggered_by: "webhook" })
        .then((runId) => {
          logger.info(`Webhook triggered workflow ${workflow_id}, run ${runId}`);
        })
        .catch((err) => {
          logger.error(`Webhook exec failed for ${workflow_id}: ${err}`);
        });

      res.status(202).json({ accepted: true, workflow_id });
    });
  }

  start(): void {
    this.server = this.app.listen(this.port, () => {
      logger.info(`Webhook server listening on port ${this.port}`);
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      logger.info("Webhook server stopped");
    }
  }
}
