import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getStore, getScheduler } from "../engine/index.js";
import { logger } from "../logger.js";
import type { WorkflowTemplate } from "../types.js";
import Handlebars from "handlebars";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const TEMPLATES_DIR = join(__dirname, "..", "templates");

function loadTemplates(): WorkflowTemplate[] {
  const files = readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const raw = readFileSync(join(TEMPLATES_DIR, f), "utf-8");
    return JSON.parse(raw) as WorkflowTemplate;
  });
}

function loadTemplate(templateId: string): WorkflowTemplate | undefined {
  const templates = loadTemplates();
  return templates.find((t) => t.template_id === templateId);
}

function substituteParams(
  obj: unknown,
  params: Record<string, unknown>,
): unknown {
  if (typeof obj === "string") {
    const template = Handlebars.compile(obj, { noEscape: true });
    return template(params);
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => substituteParams(item, params));
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteParams(value, params);
    }
    return result;
  }
  return obj;
}

// --- Tool Definitions ---

export const listWorkflowTemplatesTool: Tool = {
  name: "automation_list_workflow_templates",
  description:
    "Lists all available workflow templates with their metadata and required parameters.",
  inputSchema: {
    type: "object",
    properties: {
      category: {
        type: "string",
        description: "Optional filter by category.",
      },
    },
  },
};

export const deployTemplateTool: Tool = {
  name: "automation_deploy_template",
  description:
    "Deploys a workflow template by substituting user-provided parameters and creating an active workflow.",
  inputSchema: {
    type: "object",
    properties: {
      template_id: {
        type: "string",
        description: "The template ID to deploy.",
      },
      params: {
        type: "object",
        description:
          "Key-value pairs for required template parameters (e.g. { list_id: '123', slack_channel: '#general' }).",
      },
      enabled: {
        type: "boolean",
        description: "Whether the deployed workflow is enabled (default true).",
      },
    },
    required: ["template_id", "params"],
  },
};

// --- Handler Functions ---

export async function handleListWorkflowTemplates(
  args: Record<string, unknown>,
) {
  const { category } = args as { category?: string };
  logger.info(`Handling ${listWorkflowTemplatesTool.name}`);

  let templates = loadTemplates();
  if (category) {
    templates = templates.filter((t) => t.category === category);
  }

  const metadata = templates.map((t) => ({
    template_id: t.template_id,
    name: t.name,
    description: t.description,
    category: t.category,
    params: t.params,
  }));

  return {
    content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }],
    structuredContent: { templates: metadata },
  };
}

export async function handleDeployTemplate(args: Record<string, unknown>) {
  const { template_id, params, enabled } = args as {
    template_id: string;
    params: Record<string, unknown>;
    enabled?: boolean;
  };
  if (!template_id) throw new Error("template_id is required.");
  if (!params) throw new Error("params is required.");

  logger.info(`Handling ${deployTemplateTool.name}: ${template_id}`);

  const template = loadTemplate(template_id);
  if (!template) throw new Error(`Template "${template_id}" not found.`);

  const missing = template.params
    .filter((p) => !(p.name in params))
    .map((p) => p.name);
  if (missing.length > 0) {
    throw new Error(`Missing required params: ${missing.join(", ")}`);
  }

  const resolvedSteps = substituteParams(template.steps, params) as typeof template.steps;
  const resolvedTriggerConfig = substituteParams(
    template.trigger_config,
    params,
  ) as typeof template.trigger_config;

  const store = getStore();
  const workflow = store.createWorkflow({
    name: template.name,
    description: template.description,
    trigger_type: template.trigger_type,
    trigger_config: resolvedTriggerConfig,
    steps: resolvedSteps,
    enabled: enabled ?? true,
  });

  getScheduler().reload();

  return {
    content: [{ type: "text", text: JSON.stringify(workflow, null, 2) }],
    structuredContent: { workflow, deployed_from: template_id },
  };
}
