import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { SlackService } from "../services/integrations/slack.service.js";
import { logger } from "../logger.js";

export const slackSendMessageTool: Tool = {
  name: "slack_send_message",
  description: "Send a text message to a Slack channel.",
  inputSchema: {
    type: "object",
    properties: {
      channel: {
        type: "string",
        description: "The Slack channel ID or name to send the message to.",
      },
      text: {
        type: "string",
        description: "The message text to send.",
      },
    },
    required: ["channel", "text"],
  },
};

export const slackPostToChannelTool: Tool = {
  name: "slack_post_to_channel",
  description:
    "Post a message with optional Block Kit blocks to a Slack channel.",
  inputSchema: {
    type: "object",
    properties: {
      channel: {
        type: "string",
        description: "The Slack channel ID or name to post to.",
      },
      text: {
        type: "string",
        description: "The fallback text for the message.",
      },
      blocks: {
        type: "array",
        description: "Optional Slack Block Kit blocks for rich formatting.",
      },
    },
    required: ["channel", "text"],
  },
};

export async function handleSlackSendMessage(
  args: Record<string, unknown>,
): Promise<any> {
  logger.info(`Handling tool call: ${slackSendMessageTool.name}`);
  try {
    const service = new SlackService();
    const result = await service.sendMessage(
      args.channel as string,
      args.text as string,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    logger.error(`Error in ${slackSendMessageTool.name}:`, error);
    throw error instanceof Error
      ? error
      : new Error("Failed to send Slack message");
  }
}

export async function handleSlackPostToChannel(
  args: Record<string, unknown>,
): Promise<any> {
  logger.info(`Handling tool call: ${slackPostToChannelTool.name}`);
  try {
    const service = new SlackService();
    const result = await service.postToChannel(
      args.channel as string,
      args.text as string,
      args.blocks as unknown[] | undefined,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    logger.error(`Error in ${slackPostToChannelTool.name}:`, error);
    throw error instanceof Error
      ? error
      : new Error("Failed to post to Slack channel");
  }
}
