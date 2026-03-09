# ClickUp MCP Server

## Current Phase
Feature #7 Workflow Automation — Chunk 2/4 DONE (Step Executor + Cron Scheduler)

## Structure
- `src/engine/workflow-store.ts` — SQLite WAL store: workflows, runs, run_steps
- `src/engine/executor.ts` — sequential step runner, Handlebars templating, condition eval
- `src/engine/scheduler.ts` — node-cron wrapper, loads enabled cron workflows, reload()
- `src/types.ts` — all workflow/step/run types appended at bottom
