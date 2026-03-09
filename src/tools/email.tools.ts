import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { EmailService } from "../services/integrations/email.service.js";
import { logger } from "../logger.js";

export const emailSendEmailTool: Tool = {
  name: "email_send",
  description: "Send an email via SMTP.",
  inputSchema: {
    type: "object",
    properties: {
      to: {
        type: "string",
        description: "The recipient email address.",
      },
      subject: {
        type: "string",
        description: "The email subject line.",
      },
      body: {
        type: "string",
        description: "The plain text body of the email.",
      },
      html: {
        type: "string",
        description: "Optional HTML body of the email.",
      },
    },
    required: ["to", "subject", "body"],
  },
};

export async function handleSendEmail(
  args: Record<string, unknown>,
): Promise<any> {
  logger.info(`Handling tool call: ${emailSendEmailTool.name}`);
  try {
    const service = new EmailService();
    const result = await service.sendEmail(
      args.to as string,
      args.subject as string,
      args.body as string,
      args.html as string | undefined,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    logger.error(`Error in ${emailSendEmailTool.name}:`, error);
    throw error instanceof Error
      ? error
      : new Error("Failed to send email");
  }
}
