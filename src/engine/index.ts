export { WorkflowStore } from "./workflow-store.js";
export { Executor } from "./executor.js";
export { Scheduler } from "./scheduler.js";
export { WebhookServer } from "./webhook-server.js";

import { WorkflowStore } from "./workflow-store.js";
import { Executor } from "./executor.js";
import { Scheduler } from "./scheduler.js";
import { WebhookServer } from "./webhook-server.js";
import { config } from "../config/app.config.js";
import { logger } from "../logger.js";

let store: WorkflowStore | null = null;
let scheduler: Scheduler | null = null;
let webhookServer: WebhookServer | null = null;
let executor: Executor | null = null;

export function getStore(): WorkflowStore {
  if (!store) throw new Error("Engine not started");
  return store;
}

export function getExecutor(): Executor {
  if (!executor) throw new Error("Engine not started");
  return executor;
}

export function getScheduler(): Scheduler {
  if (!scheduler) throw new Error("Engine not started");
  return scheduler;
}

export function startEngine(): void {
  const engineConfig = config.engine;
  if (!engineConfig) {
    logger.info("Engine config not set, skipping engine start");
    return;
  }

  store = new WorkflowStore(engineConfig.dbPath);
  executor = new Executor(store);
  scheduler = new Scheduler(store, executor);
  webhookServer = new WebhookServer(
    store,
    executor,
    engineConfig.webhookPort,
    engineConfig.webhookSecret,
  );

  scheduler.start();
  webhookServer.start();
  logger.info("Workflow engine started");
}

export function stopEngine(): void {
  scheduler?.stop();
  webhookServer?.stop();
  store?.close();
  store = null;
  scheduler = null;
  webhookServer = null;
  executor = null;
  logger.info("Workflow engine stopped");
}
