import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getStore, getExecutor, getScheduler } from "../engine/index.js";
import { logger } from "../logger.js";
import type { TriggerType, WorkflowStepDef, TriggerConfig } from "../types.js";

// --- Tool Definitions ---

export const createWorkflowTool: Tool = {
  name: "automation_create_workflow",
  description: "Creates a new automation workflow with trigger type, steps, and optional schedule.",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Workflow name." },
      description: { type: "string", description: "Workflow description." },
      trigger_type: {
        type: "string",
        enum: ["cron", "webhook", "manual"],
        description: "How the workflow is triggered.",
      },
      trigger_config: {
        type: "object",
        description: "Trigger-specific config (e.g. { cron_expression: '0 9 * * *' } or { webhook_events: ['taskCreated'] }).",
      },
      steps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: ["clickup_api", "slack", "discord", "github", "email", "condition"] },
            config: { type: "object" },
          },
          required: ["name", "type", "config"],
        },
        description: "Array of step definitions to execute sequentially.",
      },
      enabled: { type: "boolean", description: "Whether the workflow is enabled (default true)." },
    },
    required: ["name", "trigger_type"],
  },
};

export const updateWorkflowTool: Tool = {
  name: "automation_update_workflow",
  description: "Updates an existing workflow's configuration or steps.",
  inputSchema: {
    type: "object",
    properties: {
      workflow_id: { type: "string", description: "The workflow ID to update." },
      name: { type: "string", description: "New name." },
      description: { type: "string", description: "New description." },
      trigger_type: { type: "string", enum: ["cron", "webhook", "manual"] },
      trigger_config: { type: "object", description: "New trigger config." },
      steps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: ["clickup_api", "slack", "discord", "github", "email", "condition"] },
            config: { type: "object" },
          },
          required: ["name", "type", "config"],
        },
      },
      enabled: { type: "boolean" },
    },
    required: ["workflow_id"],
  },
};

export const listWorkflowsTool: Tool = {
  name: "automation_list_workflows",
  description: "Lists all automation workflows, optionally filtered by trigger type.",
  inputSchema: {
    type: "object",
    properties: {
      trigger_type: {
        type: "string",
        enum: ["cron", "webhook", "manual"],
        description: "Optional filter by trigger type.",
      },
    },
  },
};

export const getWorkflowTool: Tool = {
  name: "automation_get_workflow",
  description: "Gets a single workflow by ID.",
  inputSchema: {
    type: "object",
    properties: {
      workflow_id: { type: "string", description: "The workflow ID." },
    },
    required: ["workflow_id"],
  },
};

export const deleteWorkflowTool: Tool = {
  name: "automation_delete_workflow",
  description: "Deletes a workflow by ID.",
  inputSchema: {
    type: "object",
    properties: {
      workflow_id: { type: "string", description: "The workflow ID to delete." },
    },
    required: ["workflow_id"],
  },
};

export const triggerWorkflowTool: Tool = {
  name: "automation_trigger_workflow",
  description: "Manually triggers a workflow execution and returns the run ID.",
  inputSchema: {
    type: "object",
    properties: {
      workflow_id: { type: "string", description: "The workflow ID to trigger." },
      payload: { type: "object", description: "Optional trigger payload passed to steps." },
    },
    required: ["workflow_id"],
  },
};

export const enableWorkflowTool: Tool = {
  name: "automation_enable_workflow",
  description: "Enables a workflow and reloads the scheduler.",
  inputSchema: {
    type: "object",
    properties: {
      workflow_id: { type: "string", description: "The workflow ID to enable." },
    },
    required: ["workflow_id"],
  },
};

export const disableWorkflowTool: Tool = {
  name: "automation_disable_workflow",
  description: "Disables a workflow and reloads the scheduler.",
  inputSchema: {
    type: "object",
    properties: {
      workflow_id: { type: "string", description: "The workflow ID to disable." },
    },
    required: ["workflow_id"],
  },
};

export const getWorkflowRunsTool: Tool = {
  name: "automation_get_workflow_runs",
  description: "Lists execution runs for a workflow with their status.",
  inputSchema: {
    type: "object",
    properties: {
      workflow_id: { type: "string", description: "The workflow ID." },
    },
    required: ["workflow_id"],
  },
};

// --- Handler Functions ---

export async function handleCreateWorkflow(args: Record<string, unknown>) {
  const params = args as {
    name: string;
    description?: string;
    trigger_type: TriggerType;
    trigger_config?: TriggerConfig;
    steps?: WorkflowStepDef[];
    enabled?: boolean;
  };
  if (!params.name) throw new Error("name is required.");
  if (!params.trigger_type) throw new Error("trigger_type is required.");

  logger.info(`Handling ${createWorkflowTool.name}: "${params.name}"`);
  const store = getStore();
  const workflow = store.createWorkflow(params);
  getScheduler().reload();
  return {
    content: [{ type: "text", text: JSON.stringify(workflow, null, 2) }],
    structuredContent: { workflow },
  };
}

export async function handleUpdateWorkflow(args: Record<string, unknown>) {
  const { workflow_id, ...updates } = args as {
    workflow_id: string;
    name?: string;
    description?: string;
    trigger_type?: TriggerType;
    trigger_config?: TriggerConfig;
    steps?: WorkflowStepDef[];
    enabled?: boolean;
  };
  if (!workflow_id) throw new Error("workflow_id is required.");

  logger.info(`Handling ${updateWorkflowTool.name}: ${workflow_id}`);
  const store = getStore();
  const workflow = store.updateWorkflow(workflow_id, updates);
  if (!workflow) throw new Error(`Workflow ${workflow_id} not found.`);
  getScheduler().reload();
  return {
    content: [{ type: "text", text: JSON.stringify(workflow, null, 2) }],
    structuredContent: { workflow },
  };
}

export async function handleListWorkflows(args: Record<string, unknown>) {
  const params = args as { trigger_type?: TriggerType };
  logger.info(`Handling ${listWorkflowsTool.name}`);
  const store = getStore();
  const workflows = store.listWorkflows(params.trigger_type);
  return {
    content: [{ type: "text", text: JSON.stringify(workflows, null, 2) }],
    structuredContent: { workflows },
  };
}

export async function handleGetWorkflow(args: Record<string, unknown>) {
  const params = args as { workflow_id: string };
  if (!params.workflow_id) throw new Error("workflow_id is required.");

  logger.info(`Handling ${getWorkflowTool.name}: ${params.workflow_id}`);
  const store = getStore();
  const workflow = store.getWorkflow(params.workflow_id);
  if (!workflow) throw new Error(`Workflow ${params.workflow_id} not found.`);
  return {
    content: [{ type: "text", text: JSON.stringify(workflow, null, 2) }],
    structuredContent: { workflow },
  };
}

export async function handleDeleteWorkflow(args: Record<string, unknown>) {
  const params = args as { workflow_id: string };
  if (!params.workflow_id) throw new Error("workflow_id is required.");

  logger.info(`Handling ${deleteWorkflowTool.name}: ${params.workflow_id}`);
  const store = getStore();
  const deleted = store.deleteWorkflow(params.workflow_id);
  if (!deleted) throw new Error(`Workflow ${params.workflow_id} not found.`);
  getScheduler().reload();
  return {
    content: [{ type: "text", text: `Workflow ${params.workflow_id} deleted.` }],
    structuredContent: { result: { success: true } },
  };
}

export async function handleTriggerWorkflow(args: Record<string, unknown>) {
  const params = args as { workflow_id: string; payload?: Record<string, unknown> };
  if (!params.workflow_id) throw new Error("workflow_id is required.");

  logger.info(`Handling ${triggerWorkflowTool.name}: ${params.workflow_id}`);
  const store = getStore();
  const workflow = store.getWorkflow(params.workflow_id);
  if (!workflow) throw new Error(`Workflow ${params.workflow_id} not found.`);

  const executor = getExecutor();
  const runId = await executor.execute(workflow, params.payload ?? { triggered_by: "manual" });
  return {
    content: [{ type: "text", text: JSON.stringify({ run_id: runId }, null, 2) }],
    structuredContent: { run_id: runId },
  };
}

export async function handleEnableWorkflow(args: Record<string, unknown>) {
  const params = args as { workflow_id: string };
  if (!params.workflow_id) throw new Error("workflow_id is required.");

  logger.info(`Handling ${enableWorkflowTool.name}: ${params.workflow_id}`);
  const store = getStore();
  const workflow = store.updateWorkflow(params.workflow_id, { enabled: true });
  if (!workflow) throw new Error(`Workflow ${params.workflow_id} not found.`);
  getScheduler().reload();
  return {
    content: [{ type: "text", text: JSON.stringify(workflow, null, 2) }],
    structuredContent: { workflow },
  };
}

export async function handleDisableWorkflow(args: Record<string, unknown>) {
  const params = args as { workflow_id: string };
  if (!params.workflow_id) throw new Error("workflow_id is required.");

  logger.info(`Handling ${disableWorkflowTool.name}: ${params.workflow_id}`);
  const store = getStore();
  const workflow = store.updateWorkflow(params.workflow_id, { enabled: false });
  if (!workflow) throw new Error(`Workflow ${params.workflow_id} not found.`);
  getScheduler().reload();
  return {
    content: [{ type: "text", text: JSON.stringify(workflow, null, 2) }],
    structuredContent: { workflow },
  };
}

export async function handleGetWorkflowRuns(args: Record<string, unknown>) {
  const params = args as { workflow_id: string };
  if (!params.workflow_id) throw new Error("workflow_id is required.");

  logger.info(`Handling ${getWorkflowRunsTool.name}: ${params.workflow_id}`);
  const store = getStore();
  const runs = store.getWorkflowRuns(params.workflow_id);
  return {
    content: [{ type: "text", text: JSON.stringify(runs, null, 2) }],
    structuredContent: { runs },
  };
}
