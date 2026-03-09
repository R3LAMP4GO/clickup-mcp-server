import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ClickUpService } from "../services/clickup.service.js";
import { logger } from "../logger.js";

// Tool Definitions
export const addWatcherTool: Tool = {
  name: "clickup_add_watcher",
  description: "Adds a watcher to a task.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to add the watcher to.",
      },
      user_id: {
        type: "number",
        description: "The user ID of the watcher to add.",
      },
    },
    required: ["task_id", "user_id"],
  },
};

export const removeWatcherTool: Tool = {
  name: "clickup_remove_watcher",
  description: "Removes a watcher from a task.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to remove the watcher from.",
      },
      user_id: {
        type: "number",
        description: "The user ID of the watcher to remove.",
      },
    },
    required: ["task_id", "user_id"],
  },
};

// Handler Functions
export async function handleAddWatcher(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as { task_id: string; user_id: number };
  if (!params.task_id || typeof params.task_id !== "string") {
    throw new Error("Task ID is required.");
  }
  if (params.user_id === undefined || typeof params.user_id !== "number") {
    throw new Error("User ID is required.");
  }
  logger.info(`Handling tool call: ${addWatcherTool.name} — user ${params.user_id} on task ${params.task_id}`);
  try {
    await clickUpService.watcherService.addWatcher(params.task_id, params.user_id);
    return {
      content: [
        { type: "text", text: `Watcher ${params.user_id} added to task ${params.task_id}.` },
      ],
      structuredContent: { result: { success: true, message: `Watcher ${params.user_id} added to task ${params.task_id}.` } },
    };
  } catch (error) {
    logger.error(`Error in ${addWatcherTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to add watcher");
  }
}

export async function handleRemoveWatcher(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as { task_id: string; user_id: number };
  if (!params.task_id || typeof params.task_id !== "string") {
    throw new Error("Task ID is required.");
  }
  if (params.user_id === undefined || typeof params.user_id !== "number") {
    throw new Error("User ID is required.");
  }
  logger.info(`Handling tool call: ${removeWatcherTool.name} — user ${params.user_id} from task ${params.task_id}`);
  try {
    await clickUpService.watcherService.removeWatcher(params.task_id, params.user_id);
    return {
      content: [
        { type: "text", text: `Watcher ${params.user_id} removed from task ${params.task_id}.` },
      ],
      structuredContent: { result: { success: true, message: `Watcher ${params.user_id} removed from task ${params.task_id}.` } },
    };
  } catch (error) {
    logger.error(`Error in ${removeWatcherTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to remove watcher");
  }
}
