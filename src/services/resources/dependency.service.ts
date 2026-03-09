import axios, { AxiosInstance } from "axios";
import { logger } from "../../logger.js";
import { AddDependencyParams, DeleteDependencyParams } from "../../types.js";

export class DependencyService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async addDependency(params: AddDependencyParams): Promise<any> {
    logger.debug(`Adding dependency to task ${params.task_id}`);
    try {
      const { task_id, ...body } = params;
      const response = await this.client.post(
        `/v2/task/${task_id}/dependency`,
        body,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error adding dependency: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error adding dependency: ${error.message}`);
      }
      throw new Error("Failed to add dependency in ClickUp");
    }
  }

  async deleteDependency(params: DeleteDependencyParams): Promise<void> {
    logger.debug(`Deleting dependency from task ${params.task_id}`);
    try {
      const queryParams: Record<string, any> = {
        depends_on: params.depends_on,
        dependency_of: params.dependency_of,
      };
      await this.client.delete(
        `/v2/task/${params.task_id}/dependency`,
        { params: queryParams },
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error deleting dependency: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error deleting dependency: ${error.message}`);
      }
      throw new Error("Failed to delete dependency from ClickUp");
    }
  }
}
