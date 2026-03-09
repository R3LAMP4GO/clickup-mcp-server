import { WebClient } from "@slack/web-api";
import { config } from "../../config/app.config.js";
import { logger } from "../../logger.js";

export class SlackService {
  private client: WebClient;

  constructor() {
    if (!config.slackBotToken) {
      throw new Error("SLACK_BOT_TOKEN is not configured");
    }
    this.client = new WebClient(config.slackBotToken);
  }

  async sendMessage(channel: string, text: string): Promise<any> {
    logger.info(`Sending Slack message to channel: ${channel}`);
    const result = await this.client.chat.postMessage({ channel, text });
    return result;
  }

  async postToChannel(
    channel: string,
    text: string,
    blocks?: unknown[],
  ): Promise<any> {
    logger.info(`Posting to Slack channel: ${channel}`);
    const payload: { channel: string; text: string; blocks?: unknown[] } = {
      channel,
      text,
    };
    if (blocks) {
      payload.blocks = blocks;
    }
    const result = await this.client.chat.postMessage(payload);
    return result;
  }
}
