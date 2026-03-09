import axios, { AxiosInstance } from "axios";
import { logger } from "../../logger.js";
import {
  CreateTimeEntryParams,
  GetTimeEntriesParams,
} from "../../types.js";

export class TimeTrackingService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async createTimeEntry(params: CreateTimeEntryParams): Promise<any> {
    logger.debug(`Creating time entry for team ${params.team_id}`);
    try {
      const { team_id, ...body } = params;
      const response = await this.client.post(
        `/v2/team/${team_id}/time_entries`,
        body,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error creating time entry: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error creating time entry: ${error.message}`);
      }
      throw new Error("Failed to create time entry in ClickUp");
    }
  }

  async getTimeEntries(params: GetTimeEntriesParams): Promise<any> {
    logger.debug(`Getting time entries for team ${params.team_id}`);
    try {
      const queryParams: Record<string, any> = {};
      if (params.start_date !== undefined) queryParams.start_date = params.start_date;
      if (params.end_date !== undefined) queryParams.end_date = params.end_date;
      if (params.assignee !== undefined) queryParams.assignee = params.assignee;
      const response = await this.client.get(
        `/v2/team/${params.team_id}/time_entries`,
        { params: queryParams },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error getting time entries: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error getting time entries: ${error.message}`);
      }
      throw new Error("Failed to get time entries from ClickUp");
    }
  }

  async deleteTimeEntry(teamId: string, timerId: string): Promise<void> {
    logger.debug(`Deleting time entry ${timerId} for team ${teamId}`);
    try {
      await this.client.delete(
        `/v2/team/${teamId}/time_entries/${timerId}`,
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error deleting time entry: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error deleting time entry: ${error.message}`);
      }
      throw new Error("Failed to delete time entry from ClickUp");
    }
  }
}
