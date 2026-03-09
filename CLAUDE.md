# ClickUp MCP Server

## Current Phase
Feature #7 Workflow Automation — Chunk 4/4 DONE (Automation MCP Tools)

## Structure
- `src/engine/workflow-store.ts` — SQLite WAL store: workflows, runs, run_steps
- `src/engine/executor.ts` — sequential step runner, Handlebars templating, condition eval
- `src/engine/scheduler.ts` — node-cron wrapper, loads enabled cron workflows, reload()
- `src/engine/webhook-server.ts` — Express POST /webhook/:id, HMAC-SHA256, GET /health
- `src/engine/index.ts` — barrel export + startEngine()/stopEngine() bootstrap
- `src/config/app.config.ts` — engine config: ENGINE_DB_PATH, ENGINE_WEBHOOK_PORT, ENGINE_WEBHOOK_SECRET
- `src/types.ts` — all workflow/step/run types appended at bottom
- `src/tools/automation.tools.ts` — 9 MCP tools: CRUD, trigger, enable/disable, get runs
