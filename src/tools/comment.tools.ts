import { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  GetTaskCommentsParams,
  CreateTaskCommentParams,
  GetListCommentsParams,
  UpdateCommentParams,
} from "../types.js";
import { ClickUpService } from "../services/clickup.service.js";
import { logger } from "../logger.js";

// Tool Definitions
export const getTaskCommentsTool: Tool = {
  name: "clickup_get_task_comments",
  description: "Retrieves all comments on a task.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to get comments for.",
      },
      start: {
        type: "number",
        description: "Timestamp (ms) to start from for pagination.",
      },
      start_id: {
        type: "string",
        description: "Comment ID to start from for pagination.",
      },
    },
    required: ["task_id"],
  },
};

export const createTaskCommentTool: Tool = {
  name: "clickup_create_task_comment",
  description: "Creates a new comment on a task.",
  inputSchema: {
    type: "object",
    properties: {
      task_id: {
        type: "string",
        description: "The ID of the task to comment on.",
      },
      comment_text: {
        type: "string",
        description: "The text content of the comment.",
      },
      assignee: {
        type: "number",
        description: "User ID to assign the comment to.",
      },
      notify_all: {
        type: "boolean",
        description: "Whether to notify all assignees.",
      },
    },
    required: ["task_id", "comment_text"],
  },
};

export const getListCommentsTool: Tool = {
  name: "clickup_get_list_comments",
  description: "Retrieves all comments on a list.",
  inputSchema: {
    type: "object",
    properties: {
      list_id: {
        type: "string",
        description: "The ID of the list to get comments for.",
      },
      start: {
        type: "number",
        description: "Timestamp (ms) to start from for pagination.",
      },
      start_id: {
        type: "string",
        description: "Comment ID to start from for pagination.",
      },
    },
    required: ["list_id"],
  },
};

export const updateCommentTool: Tool = {
  name: "clickup_update_comment",
  description: "Updates an existing comment.",
  inputSchema: {
    type: "object",
    properties: {
      comment_id: {
        type: "string",
        description: "The ID of the comment to update.",
      },
      comment_text: {
        type: "string",
        description: "The new text content of the comment.",
      },
      assignee: {
        type: "number",
        description: "User ID to assign the comment to.",
      },
      resolved: {
        type: "boolean",
        description: "Whether the comment is resolved.",
      },
    },
    required: ["comment_id", "comment_text"],
  },
};

export const deleteCommentTool: Tool = {
  name: "clickup_delete_comment",
  description: "Deletes a comment.",
  inputSchema: {
    type: "object",
    properties: {
      comment_id: {
        type: "string",
        description: "The ID of the comment to delete.",
      },
    },
    required: ["comment_id"],
  },
};

// Handler Functions
export async function handleGetTaskComments(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as GetTaskCommentsParams;
  if (!params.task_id || typeof params.task_id !== "string") {
    throw new Error("Task ID is required.");
  }
  logger.info(`Handling tool call: ${getTaskCommentsTool.name} for task ${params.task_id}`);
  try {
    const responseData = await clickUpService.commentService.getTaskComments(params);
    return {
      content: [
        { type: "text", text: JSON.stringify(responseData.comments, null, 2) },
      ],
      structuredContent: { comments: responseData.comments },
    };
  } catch (error) {
    logger.error(`Error in ${getTaskCommentsTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to get task comments");
  }
}

export async function handleCreateTaskComment(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as CreateTaskCommentParams;
  if (!params.task_id || typeof params.task_id !== "string") {
    throw new Error("Task ID is required.");
  }
  if (!params.comment_text || typeof params.comment_text !== "string") {
    throw new Error("Comment text is required.");
  }
  logger.info(`Handling tool call: ${createTaskCommentTool.name} for task ${params.task_id}`);
  try {
    const responseData = await clickUpService.commentService.createTaskComment(params);
    return {
      content: [
        { type: "text", text: JSON.stringify(responseData, null, 2) },
      ],
      structuredContent: { comment: responseData },
    };
  } catch (error) {
    logger.error(`Error in ${createTaskCommentTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to create task comment");
  }
}

export async function handleGetListComments(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as GetListCommentsParams;
  if (!params.list_id || typeof params.list_id !== "string") {
    throw new Error("List ID is required.");
  }
  logger.info(`Handling tool call: ${getListCommentsTool.name} for list ${params.list_id}`);
  try {
    const responseData = await clickUpService.commentService.getListComments(params);
    return {
      content: [
        { type: "text", text: JSON.stringify(responseData.comments, null, 2) },
      ],
      structuredContent: { comments: responseData.comments },
    };
  } catch (error) {
    logger.error(`Error in ${getListCommentsTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to get list comments");
  }
}

export async function handleUpdateComment(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as UpdateCommentParams;
  if (!params.comment_id || typeof params.comment_id !== "string") {
    throw new Error("Comment ID is required.");
  }
  if (!params.comment_text || typeof params.comment_text !== "string") {
    throw new Error("Comment text is required.");
  }
  logger.info(`Handling tool call: ${updateCommentTool.name} for comment ${params.comment_id}`);
  try {
    const responseData = await clickUpService.commentService.updateComment(params);
    return {
      content: [
        { type: "text", text: JSON.stringify(responseData, null, 2) },
      ],
      structuredContent: { comment: responseData },
    };
  } catch (error) {
    logger.error(`Error in ${updateCommentTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to update comment");
  }
}

export async function handleDeleteComment(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as { comment_id: string };
  if (!params.comment_id || typeof params.comment_id !== "string") {
    throw new Error("Comment ID is required.");
  }
  logger.info(`Handling tool call: ${deleteCommentTool.name} for comment ${params.comment_id}`);
  try {
    await clickUpService.commentService.deleteComment(params.comment_id);
    return {
      content: [
        { type: "text", text: `Comment ${params.comment_id} deleted successfully.` },
      ],
      structuredContent: { result: { success: true, message: `Comment ${params.comment_id} deleted successfully.` } },
    };
  } catch (error) {
    logger.error(`Error in ${deleteCommentTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to delete comment");
  }
}
