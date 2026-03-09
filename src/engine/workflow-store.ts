import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import type {
  Workflow,
  WorkflowRun,
  WorkflowRunStep,
  RunStatus,
  TriggerConfig,
  WorkflowStepDef,
  TriggerType,
} from "../types.js";

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  trigger_type TEXT NOT NULL CHECK(trigger_type IN ('cron','webhook','manual')),
  trigger_config TEXT NOT NULL DEFAULT '{}',
  steps TEXT NOT NULL DEFAULT '[]',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('pending','running','completed','failed')),
  trigger_payload TEXT NOT NULL DEFAULT '{}',
  started_at TEXT NOT NULL,
  completed_at TEXT,
  error TEXT
);

CREATE TABLE IF NOT EXISTS workflow_run_steps (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending','running','completed','failed')),
  input TEXT NOT NULL DEFAULT '{}',
  output TEXT,
  error TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT
);
`;

export class WorkflowStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.exec(MIGRATIONS);
  }

  close(): void {
    this.db.close();
  }

  // --- Workflow CRUD ---

  createWorkflow(params: {
    name: string;
    description?: string;
    trigger_type: TriggerType;
    trigger_config?: TriggerConfig;
    steps?: WorkflowStepDef[];
    enabled?: boolean;
  }): Workflow {
    const now = new Date().toISOString();
    const workflow: Workflow = {
      id: randomUUID(),
      name: params.name,
      description: params.description ?? "",
      trigger_type: params.trigger_type,
      trigger_config: params.trigger_config ?? {},
      steps: params.steps ?? [],
      enabled: params.enabled ?? true,
      created_at: now,
      updated_at: now,
    };
    this.db
      .prepare(
        `INSERT INTO workflows (id, name, description, trigger_type, trigger_config, steps, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        workflow.id,
        workflow.name,
        workflow.description,
        workflow.trigger_type,
        JSON.stringify(workflow.trigger_config),
        JSON.stringify(workflow.steps),
        workflow.enabled ? 1 : 0,
        workflow.created_at,
        workflow.updated_at,
      );
    return workflow;
  }

  getWorkflow(id: string): Workflow | undefined {
    const row = this.db
      .prepare("SELECT * FROM workflows WHERE id = ?")
      .get(id) as Record<string, unknown> | undefined;
    return row ? this.rowToWorkflow(row) : undefined;
  }

  listWorkflows(triggerType?: TriggerType): Workflow[] {
    const rows = triggerType
      ? (this.db
          .prepare("SELECT * FROM workflows WHERE trigger_type = ?")
          .all(triggerType) as Record<string, unknown>[])
      : (this.db
          .prepare("SELECT * FROM workflows")
          .all() as Record<string, unknown>[]);
    return rows.map((r) => this.rowToWorkflow(r));
  }

  updateWorkflow(
    id: string,
    params: Partial<
      Pick<
        Workflow,
        | "name"
        | "description"
        | "trigger_type"
        | "trigger_config"
        | "steps"
        | "enabled"
      >
    >,
  ): Workflow | undefined {
    const existing = this.getWorkflow(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...params, updated_at: new Date().toISOString() };
    this.db
      .prepare(
        `UPDATE workflows SET name=?, description=?, trigger_type=?, trigger_config=?, steps=?, enabled=?, updated_at=?
       WHERE id=?`,
      )
      .run(
        updated.name,
        updated.description,
        updated.trigger_type,
        JSON.stringify(updated.trigger_config),
        JSON.stringify(updated.steps),
        updated.enabled ? 1 : 0,
        updated.updated_at,
        id,
      );
    return updated;
  }

  deleteWorkflow(id: string): boolean {
    const result = this.db
      .prepare("DELETE FROM workflows WHERE id = ?")
      .run(id);
    return result.changes > 0;
  }

  // --- Run Logging ---

  createRun(workflowId: string, triggerPayload: Record<string, unknown> = {}): WorkflowRun {
    const run: WorkflowRun = {
      id: randomUUID(),
      workflow_id: workflowId,
      status: "pending",
      trigger_payload: triggerPayload,
      started_at: new Date().toISOString(),
      completed_at: null,
      error: null,
    };
    this.db
      .prepare(
        `INSERT INTO workflow_runs (id, workflow_id, status, trigger_payload, started_at, completed_at, error)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        run.id,
        run.workflow_id,
        run.status,
        JSON.stringify(run.trigger_payload),
        run.started_at,
        run.completed_at,
        run.error,
      );
    return run;
  }

  updateRun(
    id: string,
    params: Partial<Pick<WorkflowRun, "status" | "completed_at" | "error">>,
  ): void {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (params.status !== undefined) {
      sets.push("status=?");
      vals.push(params.status);
    }
    if (params.completed_at !== undefined) {
      sets.push("completed_at=?");
      vals.push(params.completed_at);
    }
    if (params.error !== undefined) {
      sets.push("error=?");
      vals.push(params.error);
    }
    if (sets.length === 0) return;
    vals.push(id);
    this.db.prepare(`UPDATE workflow_runs SET ${sets.join(", ")} WHERE id=?`).run(...vals);
  }

  createRunStep(params: {
    run_id: string;
    step_index: number;
    step_name: string;
    input?: Record<string, unknown>;
  }): WorkflowRunStep {
    const step: WorkflowRunStep = {
      id: randomUUID(),
      run_id: params.run_id,
      step_index: params.step_index,
      step_name: params.step_name,
      status: "pending",
      input: params.input ?? {},
      output: null,
      error: null,
      started_at: new Date().toISOString(),
      completed_at: null,
    };
    this.db
      .prepare(
        `INSERT INTO workflow_run_steps (id, run_id, step_index, step_name, status, input, output, error, started_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        step.id,
        step.run_id,
        step.step_index,
        step.step_name,
        step.status,
        JSON.stringify(step.input),
        step.output ? JSON.stringify(step.output) : null,
        step.error,
        step.started_at,
        step.completed_at,
      );
    return step;
  }

  updateRunStep(
    id: string,
    params: Partial<Pick<WorkflowRunStep, "status" | "output" | "error" | "completed_at">>,
  ): void {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (params.status !== undefined) {
      sets.push("status=?");
      vals.push(params.status);
    }
    if (params.output !== undefined) {
      sets.push("output=?");
      vals.push(JSON.stringify(params.output));
    }
    if (params.error !== undefined) {
      sets.push("error=?");
      vals.push(params.error);
    }
    if (params.completed_at !== undefined) {
      sets.push("completed_at=?");
      vals.push(params.completed_at);
    }
    if (sets.length === 0) return;
    vals.push(id);
    this.db.prepare(`UPDATE workflow_run_steps SET ${sets.join(", ")} WHERE id=?`).run(...vals);
  }

  getWorkflowRuns(workflowId: string): WorkflowRun[] {
    const rows = this.db
      .prepare("SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY started_at DESC")
      .all(workflowId) as Record<string, unknown>[];
    return rows.map((r) => this.rowToRun(r));
  }

  // --- Row Mappers ---

  private rowToWorkflow(row: Record<string, unknown>): Workflow {
    return {
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      trigger_type: row.trigger_type as Workflow["trigger_type"],
      trigger_config: JSON.parse(row.trigger_config as string),
      steps: JSON.parse(row.steps as string),
      enabled: row.enabled === 1,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  private rowToRun(row: Record<string, unknown>): WorkflowRun {
    return {
      id: row.id as string,
      workflow_id: row.workflow_id as string,
      status: row.status as RunStatus,
      trigger_payload: JSON.parse(row.trigger_payload as string),
      started_at: row.started_at as string,
      completed_at: (row.completed_at as string) ?? null,
      error: (row.error as string) ?? null,
    };
  }
}
