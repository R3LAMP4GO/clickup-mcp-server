import axios, { AxiosInstance } from "axios";
import { logger } from "../../logger.js";

export class WatcherService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async addWatcher(taskId: string, userId: number): Promise<any> {
    logger.debug(`Adding watcher ${userId} to task ${taskId}`);
    try {
      const response = await this.client.post(
        `/v2/task/${taskId}/watcher`,
        { watchers: [userId] },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error adding watcher: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error adding watcher: ${error.message}`);
      }
      throw new Error("Failed to add watcher in ClickUp");
    }
  }

  async removeWatcher(taskId: string, userId: number): Promise<void> {
    logger.debug(`Removing watcher ${userId} from task ${taskId}`);
    try {
      await this.client.delete(
        `/v2/task/${taskId}/watcher`,
        { data: { watchers: [userId] } },
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error removing watcher: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error removing watcher: ${error.message}`);
      }
      throw new Error("Failed to remove watcher from ClickUp");
    }
  }
}
