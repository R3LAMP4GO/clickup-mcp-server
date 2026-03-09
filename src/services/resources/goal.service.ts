import axios, { AxiosInstance } from "axios";
import { logger } from "../../logger.js";

export class GoalService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async getGoals(teamId: string): Promise<any> {
    logger.debug(`Getting goals for team ${teamId}`);
    try {
      const response = await this.client.get(`/v2/team/${teamId}/goal`);
      return response.data.goals ?? [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error getting goals: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error getting goals: ${error.message}`);
      }
      throw new Error("Failed to get goals from ClickUp");
    }
  }

  async createGoal(teamId: string, body: Record<string, unknown>): Promise<any> {
    logger.debug(`Creating goal in team ${teamId}`);
    try {
      const response = await this.client.post(`/v2/team/${teamId}/goal`, body);
      return response.data.goal ?? response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error creating goal: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error creating goal: ${error.message}`);
      }
      throw new Error("Failed to create goal in ClickUp");
    }
  }

  async updateGoal(goalId: string, body: Record<string, unknown>): Promise<any> {
    logger.debug(`Updating goal ${goalId}`);
    try {
      const response = await this.client.put(`/v2/goal/${goalId}`, body);
      return response.data.goal ?? response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error updating goal: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error updating goal: ${error.message}`);
      }
      throw new Error("Failed to update goal in ClickUp");
    }
  }

  async deleteGoal(goalId: string): Promise<void> {
    logger.debug(`Deleting goal ${goalId}`);
    try {
      await this.client.delete(`/v2/goal/${goalId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error deleting goal: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error deleting goal: ${error.message}`);
      }
      throw new Error("Failed to delete goal from ClickUp");
    }
  }
}
