import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DiscordService } from "../services/integrations/discord.service.js";
import { logger } from "../logger.js";

export const discordSendWebhookMessageTool: Tool = {
  name: "discord_send_webhook_message",
  description: "Send a message to a Discord channel via webhook.",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The message content to send.",
      },
      username: {
        type: "string",
        description: "Optional override for the webhook username.",
      },
      avatar_url: {
        type: "string",
        description: "Optional override for the webhook avatar URL.",
      },
    },
    required: ["content"],
  },
};

export async function handleDiscordSendWebhookMessage(
  args: Record<string, unknown>,
): Promise<any> {
  logger.info(`Handling tool call: ${discordSendWebhookMessageTool.name}`);
  try {
    const service = new DiscordService();
    const result = await service.sendWebhookMessage(
      args.content as string,
      args.username as string | undefined,
      args.avatar_url as string | undefined,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    logger.error(`Error in ${discordSendWebhookMessageTool.name}:`, error);
    throw error instanceof Error
      ? error
      : new Error("Failed to send Discord webhook message");
  }
}
