import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { AddDependencyParams, DeleteDependencyParams } from "../types.js";
import { ClickUpService } from "../services/clickup.service.js";
import { logger } from "../logger.js";

// Tool Definitions
export const addDependencyTool: Tool = {
  name: "clickup_add_dependency",
  description: "Adds a dependency relationship between two tasks.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to add the dependency to.",
      },
      depends_on: {
        type: "string",
        description: "The ID of the task that this task depends on.",
      },
      dependency_of: {
        type: "string",
        description: "The ID of the task that depends on this task.",
      },
    },
    required: ["task_id"],
  },
};

export const deleteDependencyTool: Tool = {
  name: "clickup_delete_dependency",
  description: "Removes a dependency relationship between two tasks.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to remove the dependency from.",
      },
      depends_on: {
        type: "string",
        description: "The ID of the task that this task depends on.",
      },
      dependency_of: {
        type: "string",
        description: "The ID of the task that depends on this task.",
      },
    },
    required: ["task_id"],
  },
};

// Handler Functions
export async function handleAddDependency(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as AddDependencyParams;
  if (!params.task_id || typeof params.task_id !== "string") {
    throw new Error("Task ID is required.");
  }
  if (!params.depends_on && !params.dependency_of) {
    throw new Error("Either depends_on or dependency_of is required.");
  }
  logger.info(`Handling tool call: ${addDependencyTool.name} for task ${params.task_id}`);
  try {
    await clickUpService.dependencyService.addDependency(params);
    return {
      content: [
        { type: "text", text: `Dependency added to task ${params.task_id}.` },
      ],
      structuredContent: { result: { success: true, message: `Dependency added to task ${params.task_id}.` } },
    };
  } catch (error) {
    logger.error(`Error in ${addDependencyTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to add dependency");
  }
}

export async function handleDeleteDependency(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as DeleteDependencyParams;
  if (!params.task_id || typeof params.task_id !== "string") {
    throw new Error("Task ID is required.");
  }
  if (!params.depends_on && !params.dependency_of) {
    throw new Error("Either depends_on or dependency_of is required.");
  }
  logger.info(`Handling tool call: ${deleteDependencyTool.name} for task ${params.task_id}`);
  try {
    await clickUpService.dependencyService.deleteDependency(params);
    return {
      content: [
        { type: "text", text: `Dependency removed from task ${params.task_id}.` },
      ],
      structuredContent: { result: { success: true, message: `Dependency removed from task ${params.task_id}.` } },
    };
  } catch (error) {
    logger.error(`Error in ${deleteDependencyTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to delete dependency");
  }
}
