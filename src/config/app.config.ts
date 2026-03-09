import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

// Load environment variables from .env file
dotenv.config();

interface ServerConfig {
  port: number;
  logLevel: string;
}

// Remove ClickUpConfig for OAuth
// interface ClickUpConfig {
//   clientId: string;
//   clientSecret: string;
//   redirectUri: string;
//   apiUrl: string;
//   authUrl: string;
// }

interface Config {
  server: ServerConfig;
  clickUpPersonalToken: string;
  clickUpApiUrl: string;
  encryptionKey: string;
  dataDir: string;
}

// Removed unused generateEncryptionKey - handled within validateConfig now if needed
// function generateEncryptionKey(): string {
//   return crypto.randomBytes(32).toString("hex");
// }

function validateConfig(): Config {
  // Update required env vars
  const requiredEnvVars = ["CLICKUP_PERSONAL_TOKEN"];
  // const requiredEnvVars = ["CLICKUP_CLIENT_ID", "CLICKUP_CLIENT_SECRET"];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
  }

  const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  const logLevel = process.env.LOG_LEVEL || "info";

  // Remove dynamic redirect URI logic
  // const redirectUri =
  //   process.env.CLICKUP_REDIRECT_URI ||
  //   `http://localhost:${port}/oauth/clickup/callback`;

  // Get ClickUp Personal Token
  const clickUpPersonalToken = process.env.CLICKUP_PERSONAL_TOKEN!;

  // Get or Generate encryption key (still potentially useful for encrypting the token at rest)
  const encryptionKey =
    process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");

  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");

  return {
    server: {
      port,
      logLevel,
    },
    clickUpPersonalToken,
    clickUpApiUrl: "https://api.clickup.com/api",
    encryptionKey,
    dataDir,
  };
}

export const config = validateConfig();
