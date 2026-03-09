import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GetSpaceTagsParams } from "../types.js";
import { ClickUpService } from "../services/clickup.service.js";
import { logger } from "../logger.js";

// Tool Definitions
export const getSpaceTagsTool: Tool = {
  name: "clickup_get_space_tags",
  description: "Retrieves all tags in a space.",
  inputSchema: {
    type: "object",
    properties: {
      space_id: {
        type: "string",
        description: "The ID of the space to get tags for.",
      },
    },
    required: ["space_id"],
  },
};

export const addTagToTaskTool: Tool = {
  name: "clickup_add_tag_to_task",
  description: "Adds a tag to a task.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to add the tag to.",
      },
      tag_name: {
        type: "string",
        description: "The name of the tag to add.",
      },
    },
    required: ["task_id", "tag_name"],
  },
};

export const removeTagFromTaskTool: Tool = {
  name: "clickup_remove_tag_from_task",
  description: "Removes a tag from a task.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to remove the tag from.",
      },
      tag_name: {
        type: "string",
        description: "The name of the tag to remove.",
      },
    },
    required: ["task_id", "tag_name"],
  },
};

// Handler Functions
export async function handleGetSpaceTags(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as GetSpaceTagsParams;
  if (!params.space_id || typeof params.space_id !== "string") {
    throw new Error("Space ID is required.");
  }
  logger.info(
    `Handling tool call: ${getSpaceTagsTool.name} for space ${params.space_id}`,
  );
  try {
    const responseData = await clickUpService.tagService.getSpaceTags(params);
    return {
      content: [
        { type: "text", text: JSON.stringify(responseData.tags, null, 2) },
      ],
      structuredContent: { tags: responseData.tags },
    };
  } catch (error) {
    logger.error(`Error in ${getSpaceTagsTool.name}:`, error);
    throw error instanceof Error
      ? error
      : new Error("Failed to get space tags");
  }
}

export async function handleAddTagToTask(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as { task_id: string; tag_name: string };
  if (!params.task_id || typeof params.task_id !== "string") {
    throw new Error("Task ID is required.");
  }
  if (!params.tag_name || typeof params.tag_name !== "string") {
    throw new Error("Tag name is required.");
  }
  logger.info(
    `Handling tool call: ${addTagToTaskTool.name} — tag "${params.tag_name}" on task ${params.task_id}`,
  );
  try {
    await clickUpService.tagService.addTagToTask(
      params.task_id,
      params.tag_name,
    );
    return {
      content: [
        {
          type: "text",
          text: `Tag "${params.tag_name}" added to task ${params.task_id}.`,
        },
      ],
      structuredContent: {
        result: {
          success: true,
          message: `Tag "${params.tag_name}" added to task ${params.task_id}.`,
        },
      },
    };
  } catch (error) {
    logger.error(`Error in ${addTagToTaskTool.name}:`, error);
    throw error instanceof Error
      ? error
      : new Error("Failed to add tag to task");
  }
}

export async function handleRemoveTagFromTask(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as { task_id: string; tag_name: string };
  if (!params.task_id || typeof params.task_id !== "string") {
    throw new Error("Task ID is required.");
  }
  if (!params.tag_name || typeof params.tag_name !== "string") {
    throw new Error("Tag name is required.");
  }
  logger.info(
    `Handling tool call: ${removeTagFromTaskTool.name} — tag "${params.tag_name}" from task ${params.task_id}`,
  );
  try {
    await clickUpService.tagService.removeTagFromTask(
      params.task_id,
      params.tag_name,
    );
    return {
      content: [
        {
          type: "text",
          text: `Tag "${params.tag_name}" removed from task ${params.task_id}.`,
        },
      ],
      structuredContent: {
        result: {
          success: true,
          message: `Tag "${params.tag_name}" removed from task ${params.task_id}.`,
        },
      },
    };
  } catch (error) {
    logger.error(`Error in ${removeTagFromTaskTool.name}:`, error);
    throw error instanceof Error
      ? error
      : new Error("Failed to remove tag from task");
  }
}
