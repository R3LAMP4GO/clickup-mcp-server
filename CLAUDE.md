# ClickUp MCP Server

## Current Phase
Feature #8 Workflow Templates — Chunk 2/3 DONE (Template MCP tools + wiring)

## Structure
- `src/engine/workflow-store.ts` — SQLite WAL store: workflows, runs, run_steps
- `src/engine/executor.ts` — sequential step runner, Handlebars templating, condition eval
- `src/engine/scheduler.ts` — node-cron wrapper, loads enabled cron workflows, reload()
- `src/engine/webhook-server.ts` — Express POST /webhook/:id, HMAC-SHA256, GET /health
- `src/engine/index.ts` — barrel export + startEngine()/stopEngine() bootstrap
- `src/config/app.config.ts` — engine config: ENGINE_DB_PATH, ENGINE_WEBHOOK_PORT, ENGINE_WEBHOOK_SECRET
- `src/types.ts` — all workflow/step/run types appended at bottom
- `src/tools/automation.tools.ts` — 9 MCP tools: CRUD, trigger, enable/disable, get runs
- `src/templates/*.json` — 5 workflow templates (standup, overdue, comment→slack, PR→clickup, time report)
- `src/types.ts` — WorkflowTemplate, TemplateParam types
- `src/tools/template.tools.ts` — 2 MCP tools: list_workflow_templates, deploy_template
