import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ClickUpService } from "../services/clickup.service.js";
import { logger } from "../logger.js";

// Tool Definitions
export const getWebhooksTool: Tool = {
  name: "clickup_get_webhooks",
  description: "Retrieves all Webhooks for a Workspace.",
  inputSchema: {
    type: "object",
    properties: {
      team_id: {
        type: "string",
        description: "The ID of the Workspace (Team).",
      },
    },
    required: ["team_id"],
  },
};

export const createWebhookTool: Tool = {
  name: "clickup_create_webhook",
  description: "Creates a new Webhook in a Workspace.",
  inputSchema: {
    type: "object",
    properties: {
      team_id: {
        type: "string",
        description: "The ID of the Workspace (Team).",
      },
      endpoint: {
        type: "string",
        description: "The URL to receive webhook payloads.",
      },
      events: {
        type: "array",
        items: { type: "string" },
        description: "Array of event names to subscribe to (e.g. taskCreated, taskUpdated, taskDeleted).",
      },
      space_id: {
        type: "string",
        description: "Optional Space ID to scope the webhook to.",
      },
      folder_id: {
        type: "string",
        description: "Optional Folder ID to scope the webhook to.",
      },
      list_id: {
        type: "string",
        description: "Optional List ID to scope the webhook to.",
      },
      task_id: {
        type: "string",
        description: "Optional Task ID to scope the webhook to.",
      },
    },
    required: ["team_id", "endpoint", "events"],
  },
};

export const deleteWebhookTool: Tool = {
  name: "clickup_delete_webhook",
  description: "Deletes a Webhook.",
  inputSchema: {
    type: "object",
    properties: {
      webhook_id: {
        type: "string",
        description: "The ID of the webhook to delete.",
      },
    },
    required: ["webhook_id"],
  },
};

// Handler Functions
export async function handleGetWebhooks(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as { team_id: string };
  if (!params.team_id || typeof params.team_id !== "string") {
    throw new Error("Team ID is required.");
  }
  logger.info(`Handling tool call: ${getWebhooksTool.name} — team ${params.team_id}`);
  try {
    const webhooks = await clickUpService.webhookService.getWebhooks(params.team_id);
    return {
      content: [{ type: "text", text: JSON.stringify(webhooks, null, 2) }],
      structuredContent: { webhooks },
    };
  } catch (error) {
    logger.error(`Error in ${getWebhooksTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to get webhooks");
  }
}

export async function handleCreateWebhook(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as {
    team_id: string;
    endpoint: string;
    events: string[];
    space_id?: string;
    folder_id?: string;
    list_id?: string;
    task_id?: string;
  };
  if (!params.team_id || typeof params.team_id !== "string") {
    throw new Error("Team ID is required.");
  }
  if (!params.endpoint || typeof params.endpoint !== "string") {
    throw new Error("Endpoint URL is required.");
  }
  if (!params.events || !Array.isArray(params.events)) {
    throw new Error("Events array is required.");
  }
  logger.info(`Handling tool call: ${createWebhookTool.name} — endpoint "${params.endpoint}" in team ${params.team_id}`);
  try {
    const body: Record<string, unknown> = {
      endpoint: params.endpoint,
      events: params.events,
    };
    if (params.space_id !== undefined) body.space_id = params.space_id;
    if (params.folder_id !== undefined) body.folder_id = params.folder_id;
    if (params.list_id !== undefined) body.list_id = params.list_id;
    if (params.task_id !== undefined) body.task_id = params.task_id;
    const webhook = await clickUpService.webhookService.createWebhook(params.team_id, body);
    return {
      content: [{ type: "text", text: JSON.stringify(webhook, null, 2) }],
      structuredContent: { webhook },
    };
  } catch (error) {
    logger.error(`Error in ${createWebhookTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to create webhook");
  }
}

export async function handleDeleteWebhook(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as { webhook_id: string };
  if (!params.webhook_id || typeof params.webhook_id !== "string") {
    throw new Error("Webhook ID is required.");
  }
  logger.info(`Handling tool call: ${deleteWebhookTool.name} — webhook ${params.webhook_id}`);
  try {
    await clickUpService.webhookService.deleteWebhook(params.webhook_id);
    return {
      content: [{ type: "text", text: `Webhook ${params.webhook_id} deleted.` }],
      structuredContent: { result: { success: true, message: `Webhook ${params.webhook_id} deleted.` } },
    };
  } catch (error) {
    logger.error(`Error in ${deleteWebhookTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to delete webhook");
  }
}
