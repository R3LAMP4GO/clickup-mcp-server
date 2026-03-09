import nodemailer from "nodemailer";
import { config } from "../../config/app.config.js";
import { logger } from "../../logger.js";

export class EmailService {
  private transporter: nodemailer.Transporter;
  private from: string;

  constructor() {
    if (!config.smtp) {
      throw new Error(
        "SMTP is not configured (requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)",
      );
    }
    this.from = config.smtp.from;
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    html?: string,
  ): Promise<any> {
    logger.info(`Sending email to ${to}: ${subject}`);
    const result = await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      text: body,
      html,
    });
    return result;
  }
}
