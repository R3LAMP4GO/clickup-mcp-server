import { config } from "../../config/app.config.js";
import { logger } from "../../logger.js";

export class DiscordService {
  private webhookUrl: string;

  constructor() {
    if (!config.discordWebhookUrl) {
      throw new Error("DISCORD_WEBHOOK_URL is not configured");
    }
    this.webhookUrl = config.discordWebhookUrl;
  }

  async sendWebhookMessage(
    content: string,
    username?: string,
    avatarUrl?: string,
  ): Promise<any> {
    logger.info("Sending Discord webhook message");
    const body: Record<string, string> = { content };
    if (username) body.username = username;
    if (avatarUrl) body.avatar_url = avatarUrl;

    const response = await fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Discord webhook failed (${response.status}): ${text}`);
    }

    // Discord returns 204 No Content on success
    if (response.status === 204) {
      return { success: true };
    }
    return await response.json();
  }
}
