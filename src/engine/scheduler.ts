import cron from "node-cron";
import { WorkflowStore } from "./workflow-store.js";
import { Executor } from "./executor.js";
import { logger } from "../logger.js";

const DEFAULT_TZ = "America/Chicago";

export class Scheduler {
  private tasks = new Map<string, cron.ScheduledTask>();

  constructor(
    private store: WorkflowStore,
    private executor: Executor,
  ) {}

  start(): void {
    this.reload();
    logger.info("Scheduler started");
  }

  stop(): void {
    for (const [id, task] of this.tasks) {
      task.stop();
      logger.info(`Stopped cron for workflow ${id}`);
    }
    this.tasks.clear();
  }

  reload(): void {
    this.stop();

    const workflows = this.store.listWorkflows("cron");
    for (const wf of workflows) {
      if (!wf.enabled) continue;
      const expr = wf.trigger_config.cron_expression;
      if (!expr) {
        logger.warn(`Workflow ${wf.id} has no cron_expression, skipping`);
        continue;
      }
      if (!cron.validate(expr)) {
        logger.warn(`Workflow ${wf.id} has invalid cron "${expr}", skipping`);
        continue;
      }

      const task = cron.schedule(
        expr,
        () => {
          logger.info(`Cron triggered workflow ${wf.id} (${wf.name})`);
          this.executor
            .execute(wf, { triggered_by: "cron" })
            .catch((err) =>
              logger.error(`Cron exec failed for ${wf.id}: ${err}`),
            );
        },
        { timezone: DEFAULT_TZ },
      );

      this.tasks.set(wf.id, task);
      logger.info(`Scheduled workflow ${wf.id} (${wf.name}) cron="${expr}"`);
    }
  }
}
