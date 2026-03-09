import axios, { AxiosInstance } from "axios";
import { logger } from "../../logger.js";

export class WebhookService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async getWebhooks(teamId: string): Promise<any> {
    logger.debug(`Getting webhooks for team ${teamId}`);
    try {
      const response = await this.client.get(`/v2/team/${teamId}/webhook`);
      return response.data.webhooks ?? [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error getting webhooks: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error getting webhooks: ${error.message}`);
      }
      throw new Error("Failed to get webhooks from ClickUp");
    }
  }

  async createWebhook(teamId: string, body: Record<string, unknown>): Promise<any> {
    logger.debug(`Creating webhook in team ${teamId}`);
    try {
      const response = await this.client.post(`/v2/team/${teamId}/webhook`, body);
      return response.data.webhook ?? response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error creating webhook: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error creating webhook: ${error.message}`);
      }
      throw new Error("Failed to create webhook in ClickUp");
    }
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    logger.debug(`Deleting webhook ${webhookId}`);
    try {
      await this.client.delete(`/v2/webhook/${webhookId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error deleting webhook: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error deleting webhook: ${error.message}`);
      }
      throw new Error("Failed to delete webhook from ClickUp");
    }
  }
}
