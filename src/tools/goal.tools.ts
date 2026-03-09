import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ClickUpService } from "../services/clickup.service.js";
import { logger } from "../logger.js";

// Tool Definitions
export const getGoalsTool: Tool = {
  name: "clickup_get_goals",
  description: "Retrieves all Goals for a Workspace.",
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

export const createGoalTool: Tool = {
  name: "clickup_create_goal",
  description: "Creates a new Goal in a Workspace.",
  inputSchema: {
    type: "object",
    properties: {
      team_id: {
        type: "string",
        description: "The ID of the Workspace (Team).",
      },
      name: {
        type: "string",
        description: "The name of the goal.",
      },
      due_date: {
        type: "number",
        description: "Due date as Unix timestamp in milliseconds.",
      },
      description: {
        type: "string",
        description: "Description of the goal.",
      },
      multiple_owners: {
        type: "boolean",
        description: "Allow multiple owners.",
      },
      owners: {
        type: "array",
        items: { type: "number" },
        description: "Array of user IDs who own the goal.",
      },
      color: {
        type: "string",
        description: "Hex color code for the goal.",
      },
    },
    required: ["team_id", "name"],
  },
};

export const updateGoalTool: Tool = {
  name: "clickup_update_goal",
  description: "Updates an existing Goal.",
  inputSchema: {
    type: "object",
    properties: {
      goal_id: {
        type: "string",
        description: "The ID of the goal to update.",
      },
      name: {
        type: "string",
        description: "New name for the goal.",
      },
      due_date: {
        type: "number",
        description: "New due date as Unix timestamp in milliseconds.",
      },
      description: {
        type: "string",
        description: "New description.",
      },
      color: {
        type: "string",
        description: "New hex color code.",
      },
    },
    required: ["goal_id"],
  },
};

export const deleteGoalTool: Tool = {
  name: "clickup_delete_goal",
  description: "Deletes a Goal.",
  inputSchema: {
    type: "object",
    properties: {
      goal_id: {
        type: "string",
        description: "The ID of the goal to delete.",
      },
    },
    required: ["goal_id"],
  },
};

// Handler Functions
export async function handleGetGoals(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as { team_id: string };
  if (!params.team_id || typeof params.team_id !== "string") {
    throw new Error("Team ID is required.");
  }
  logger.info(`Handling tool call: ${getGoalsTool.name} — team ${params.team_id}`);
  try {
    const goals = await clickUpService.goalService.getGoals(params.team_id);
    return {
      content: [{ type: "text", text: JSON.stringify(goals, null, 2) }],
      structuredContent: { goals },
    };
  } catch (error) {
    logger.error(`Error in ${getGoalsTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to get goals");
  }
}

export async function handleCreateGoal(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as {
    team_id: string;
    name: string;
    due_date?: number;
    description?: string;
    multiple_owners?: boolean;
    owners?: number[];
    color?: string;
  };
  if (!params.team_id || typeof params.team_id !== "string") {
    throw new Error("Team ID is required.");
  }
  if (!params.name || typeof params.name !== "string") {
    throw new Error("Goal name is required.");
  }
  logger.info(`Handling tool call: ${createGoalTool.name} — "${params.name}" in team ${params.team_id}`);
  try {
    const body: Record<string, unknown> = { name: params.name };
    if (params.due_date !== undefined) body.due_date = params.due_date;
    if (params.description !== undefined) body.description = params.description;
    if (params.multiple_owners !== undefined) body.multiple_owners = params.multiple_owners;
    if (params.owners !== undefined) body.owners = params.owners;
    if (params.color !== undefined) body.color = params.color;
    const goal = await clickUpService.goalService.createGoal(params.team_id, body);
    return {
      content: [{ type: "text", text: JSON.stringify(goal, null, 2) }],
      structuredContent: { goal },
    };
  } catch (error) {
    logger.error(`Error in ${createGoalTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to create goal");
  }
}

export async function handleUpdateGoal(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as {
    goal_id: string;
    name?: string;
    due_date?: number;
    description?: string;
    color?: string;
  };
  if (!params.goal_id || typeof params.goal_id !== "string") {
    throw new Error("Goal ID is required.");
  }
  logger.info(`Handling tool call: ${updateGoalTool.name} — goal ${params.goal_id}`);
  try {
    const body: Record<string, unknown> = {};
    if (params.name !== undefined) body.name = params.name;
    if (params.due_date !== undefined) body.due_date = params.due_date;
    if (params.description !== undefined) body.description = params.description;
    if (params.color !== undefined) body.color = params.color;
    const goal = await clickUpService.goalService.updateGoal(params.goal_id, body);
    return {
      content: [{ type: "text", text: JSON.stringify(goal, null, 2) }],
      structuredContent: { goal },
    };
  } catch (error) {
    logger.error(`Error in ${updateGoalTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to update goal");
  }
}

export async function handleDeleteGoal(
  clickUpService: ClickUpService,
  args: Record<string, unknown>,
) {
  const params = args as unknown as { goal_id: string };
  if (!params.goal_id || typeof params.goal_id !== "string") {
    throw new Error("Goal ID is required.");
  }
  logger.info(`Handling tool call: ${deleteGoalTool.name} — goal ${params.goal_id}`);
  try {
    await clickUpService.goalService.deleteGoal(params.goal_id);
    return {
      content: [{ type: "text", text: `Goal ${params.goal_id} deleted.` }],
      structuredContent: { result: { success: true, message: `Goal ${params.goal_id} deleted.` } },
    };
  } catch (error) {
    logger.error(`Error in ${deleteGoalTool.name}:`, error);
    throw error instanceof Error ? error : new Error("Failed to delete goal");
  }
}
