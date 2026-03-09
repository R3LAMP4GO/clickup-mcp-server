import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { logger } from "../logger.js";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");

export interface TokenRecord {
  token: string;
  user_name: string;
  created_at: string;
  last_used: string | null;
}

let db: Database.Database;

function getDb(): Database.Database {
  if (db) return db;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const dbPath = path.join(DATA_DIR, "auth.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      token TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used TEXT
    )
  `);

  return db;
}

export function generateToken(userName: string): string {
  const database = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  database
    .prepare("INSERT INTO tokens (token, user_name) VALUES (?, ?)")
    .run(token, userName);
  return token;
}

export function listTokens(): TokenRecord[] {
  const database = getDb();
  return database
    .prepare("SELECT token, user_name, created_at, last_used FROM tokens")
    .all() as TokenRecord[];
}

export function revokeToken(token: string): boolean {
  const database = getDb();
  const result = database
    .prepare("DELETE FROM tokens WHERE token = ?")
    .run(token);
  return result.changes > 0;
}

function validateToken(token: string): boolean {
  const database = getDb();
  const row = database
    .prepare("SELECT token FROM tokens WHERE token = ?")
    .get(token);
  if (row) {
    database
      .prepare("UPDATE tokens SET last_used = datetime('now') WHERE token = ?")
      .run(token);
    return true;
  }
  return false;
}

export function ensureAdminToken(): void {
  const database = getDb();
  const count = database
    .prepare("SELECT COUNT(*) as count FROM tokens")
    .get() as { count: number };

  if (count.count === 0) {
    const envToken = process.env.MCP_ADMIN_TOKEN;
    if (envToken) {
      database
        .prepare("INSERT INTO tokens (token, user_name) VALUES (?, ?)")
        .run(envToken, "admin");
      logger.info("Admin token loaded from MCP_ADMIN_TOKEN env var.");
    } else {
      const token = generateToken("admin");
      logger.info("==============================================");
      logger.info("AUTO-GENERATED ADMIN TOKEN (save this!):");
      logger.info(token);
      logger.info("==============================================");
    }
  }
}

export function bearerAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  if (!validateToken(token)) {
    res.status(403).json({ error: "Invalid token" });
    return;
  }

  next();
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
