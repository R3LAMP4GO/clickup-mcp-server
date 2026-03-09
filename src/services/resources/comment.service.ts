import axios, { AxiosInstance } from "axios";
import { logger } from "../../logger.js";
import {
  GetTaskCommentsParams,
  CreateTaskCommentParams,
  GetListCommentsParams,
  UpdateCommentParams,
} from "../../types.js";

export class CommentService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async getTaskComments(params: GetTaskCommentsParams): Promise<any> {
    logger.debug(`Getting comments for task ${params.task_id}`);
    try {
      const queryParams: Record<string, any> = {};
      if (params.start !== undefined) queryParams.start = params.start;
      if (params.start_id !== undefined) queryParams.start_id = params.start_id;
      const response = await this.client.get(
        `/v2/task/${params.task_id}/comment`,
        { params: queryParams },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error getting task comments: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error getting task comments: ${error.message}`);
      }
      throw new Error("Failed to get task comments from ClickUp");
    }
  }

  async createTaskComment(params: CreateTaskCommentParams): Promise<any> {
    logger.debug(`Creating comment on task ${params.task_id}`);
    try {
      const { task_id, ...body } = params;
      const response = await this.client.post(
        `/v2/task/${task_id}/comment`,
        body,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error creating task comment: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error creating task comment: ${error.message}`);
      }
      throw new Error("Failed to create task comment in ClickUp");
    }
  }

  async getListComments(params: GetListCommentsParams): Promise<any> {
    logger.debug(`Getting comments for list ${params.list_id}`);
    try {
      const queryParams: Record<string, any> = {};
      if (params.start !== undefined) queryParams.start = params.start;
      if (params.start_id !== undefined) queryParams.start_id = params.start_id;
      const response = await this.client.get(
        `/v2/list/${params.list_id}/comment`,
        { params: queryParams },
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error getting list comments: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error getting list comments: ${error.message}`);
      }
      throw new Error("Failed to get list comments from ClickUp");
    }
  }

  async updateComment(params: UpdateCommentParams): Promise<any> {
    logger.debug(`Updating comment ${params.comment_id}`);
    try {
      const { comment_id, ...body } = params;
      const response = await this.client.put(
        `/v2/comment/${comment_id}`,
        body,
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error updating comment: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error updating comment: ${error.message}`);
      }
      throw new Error("Failed to update comment in ClickUp");
    }
  }

  async deleteComment(commentId: string): Promise<void> {
    logger.debug(`Deleting comment ${commentId}`);
    try {
      await this.client.delete(`/v2/comment/${commentId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Axios error deleting comment: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else if (error instanceof Error) {
        logger.error(`Error deleting comment: ${error.message}`);
      }
      throw new Error("Failed to delete comment from ClickUp");
    }
  }
}
