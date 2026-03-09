import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { CreateTimeEntryParams, GetTimeEntriesParams } from "../types.js";
import { ClickUpService } from "../services/clickup.service.js";
import { logger } from "../logger.js";

// Tool Definitions
export const createTimeEntryTool: Tool = {
  name: "clickup_create_time_entry",
  description: "Creates a time entry for a task in a workspace.",
  inputSchema: {
    type: "object",
    properties: {
      team_id: {
        type: "string",
        description: "The ID of the workspace (team).",
      },
      task_id: {
        type: "string",
        description: "The ID of the task to log time for.",
      },
      start: {
        type: "number",
        description: "Start timestamp in Unix milliseconds.",
      },
      duration: {
        type: "number",
        description: "Duration in milliseconds.",
      },
      description: {
        type: "string",
        description: "Description of the time entry.",
      },
    },
    required: ["team_id", "task_id", "start", "duration"],
  },
};

export const getTimeEntriesTool: Tool = {
  name: "clickup_get_time_entries",
  description: "Retrieves time entries for a workspace.",
  inputSchema: {
    type: "object",
    properties: {
      team_id: {
        type: "string",
        description: "The ID of the workspace (team).",
      },
      start_date: {
        type: "number",
        description: "Start date timestamp in Unix milliseconds.",
      },
      end_date: {
        type: "number",
        description: "End date timestamp in Unix milliseconds.",
      },
      assignee: {
        type: "number",
        description: "User ID to filter time entries by.",
      },
    },
    required: ["team_id"],
  },
};

export const deleteTimeEntryTool: Tool = {
  name: "clickup_delete_time_entry",
  description: "Deletes a time entry.",
  inputSchema: {
    type: "object",
    properties: {
      team_id: {
        type: "string",
        description: "The ID of the workspace (team).",
      },
      timer_id: {
        type: "string",
        description: "The ID of the time entry to delete.",
      },
    },
    required: ["team_id", "timer_id"],
  },
};

// Handler Functions
export async function handleCreateTimeEntry(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as CreateTimeEntryParams;
  if (!params.team_id || typeof params.team_id !== "string") {
    throw new Error("Team ID is required.");
  }
  if (!params.task_id || typeof params.task_id !== "string") {
    throw new Error("Task ID is required.");
  }
  logger.info(`Handling tool call: ${createTimeEntryTool.name} for team ${params.team_id}`);
  try {
    const responseData = await clickUpService.timeTrackingService.createTimeEntry(params);
    return {
      content: [
        { type: "text", text: JSON.stringify(responseData, null, 2) },
      ],
      structuredContent: { time_entry: responseData },
    };
  } catch (error) {
    logger.error(`Error in ${createTimeEntryTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to create time entry");
  }
}

export async function handleGetTimeEntries(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as GetTimeEntriesParams;
  if (!params.team_id || typeof params.team_id !== "string") {
    throw new Error("Team ID is required.");
  }
  logger.info(`Handling tool call: ${getTimeEntriesTool.name} for team ${params.team_id}`);
  try {
    const responseData = await clickUpService.timeTrackingService.getTimeEntries(params);
    return {
      content: [
        { type: "text", text: JSON.stringify(responseData.data, null, 2) },
      ],
      structuredContent: { time_entries: responseData.data },
    };
  } catch (error) {
    logger.error(`Error in ${getTimeEntriesTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to get time entries");
  }
}

export async function handleDeleteTimeEntry(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as { team_id: string; timer_id: string };
  if (!params.team_id || typeof params.team_id !== "string") {
    throw new Error("Team ID is required.");
  }
  if (!params.timer_id || typeof params.timer_id !== "string") {
    throw new Error("Timer ID is required.");
  }
  logger.info(`Handling tool call: ${deleteTimeEntryTool.name} for timer ${params.timer_id}`);
  try {
    await clickUpService.timeTrackingService.deleteTimeEntry(params.team_id, params.timer_id);
    return {
      content: [
        { type: "text", text: `Time entry ${params.timer_id} deleted successfully.` },
      ],
      structuredContent: { result: { success: true, message: `Time entry ${params.timer_id} deleted successfully.` } },
    };
  } catch (error) {
    logger.error(`Error in ${deleteTimeEntryTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to delete time entry");
  }
}
