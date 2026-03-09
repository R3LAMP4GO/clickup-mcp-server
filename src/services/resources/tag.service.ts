import axios, { AxiosInstance } from "axios";
import { logger } from "../../logger.js";
import { GetSpaceTagsParams } from "../../types.js";

export class TagService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async getSpaceTags(params: GetSpaceTagsParams): Promise<any> {
    logger.debug(`Getting tags for space ${params.space_id}`);
    try {
      const response = await this.client.get(
        `/v2/space/${params.space_id}/tag`,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error getting space tags: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error getting space tags: ${error.message}`);
      }
      throw new Error("Failed to get space tags from ClickUp");
    }
  }

  async addTagToTask(taskId: string, tagName: string): Promise<any> {
    logger.debug(`Adding tag "${tagName}" to task ${taskId}`);
    try {
      const response = await this.client.post(
        `/v2/task/${taskId}/tag/${tagName}`,
        {},
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error adding tag to task: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error adding tag to task: ${error.message}`);
      }
      throw new Error("Failed to add tag to task in ClickUp");
    }
  }

  async removeTagFromTask(taskId: string, tagName: string): Promise<void> {
    logger.debug(`Removing tag "${tagName}" from task ${taskId}`);
    try {
      await this.client.delete(`/v2/task/${taskId}/tag/${tagName}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error removing tag from task: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error removing tag from task: ${error.message}`);
      }
      throw new Error("Failed to remove tag from task in ClickUp");
    }
  }
}
