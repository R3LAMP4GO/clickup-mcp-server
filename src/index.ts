#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import express from "express";
import { ClickUpService } from "./services/clickup.service.js";
import { config } from "./config/app.config.js";
import { logger } from "./logger.js";
import {
  bearerAuthMiddleware,
  ensureAdminToken,
  generateToken,
  listTokens,
  revokeToken,
} from "./middleware/auth.js";

// ClickUp type imports
import {
  ClickUpTask,
  ClickUpBoard,
  GetSpacesParams,
  CreateSpaceParams,
  UpdateSpaceParams,
  GetFoldersParams,
  CreateFolderParams,
  UpdateFolderParams,
  GetCustomFieldsParams,
  ClickUpCustomField,
  SetTaskCustomFieldValueParams,
  RemoveTaskCustomFieldValueParams,
  SearchDocsParams,
  ClickUpDoc,
  CreateDocParams,
  GetDocPagesParams,
  ClickUpDocPage,
  CreateDocPageParams,
  GetDocPageContentParams,
  EditDocPageContentParams,
  ClickUpViewParentType,
  ClickUpViewType,
} from "./types.js";

// Tool definitions + handlers
import {
  createTaskTool,
  updateTaskTool,
  handleCreateTask,
  handleUpdateTask,
} from "./tools/task.tools.js";
import {
  getSpacesTool,
  createSpaceTool,
  getSpaceTool,
  updateSpaceTool,
  deleteSpaceTool,
  handleGetSpaces,
  handleCreateSpace,
  handleGetSpace,
  handleUpdateSpace,
  handleDeleteSpace,
} from "./tools/space.tools.js";
import {
  getFoldersTool,
  createFolderTool,
  getFolderTool,
  updateFolderTool,
  deleteFolderTool,
  handleGetFolders,
  handleCreateFolder,
  handleGetFolder,
  handleUpdateFolder,
  handleDeleteFolder,
} from "./tools/folder.tools.js";
import {
  getCustomFieldsTool,
  setTaskCustomFieldValueTool,
  removeTaskCustomFieldValueTool,
  handleGetCustomFields,
  handleSetTaskCustomFieldValue,
  handleRemoveTaskCustomFieldValue,
} from "./tools/custom-field.tools.js";
import {
  searchDocsTool,
  createDocTool,
  getDocPagesTool,
  createDocPageTool,
  getDocPageContentTool,
  editDocPageContentTool,
  handleSearchDocs,
  handleCreateDoc,
  handleGetDocPages,
  handleCreateDocPage,
  handleGetDocPageContent,
  handleEditDocPageContent,
} from "./tools/doc.tools.js";
import {
  getViewsTool,
  createViewTool,
  getViewDetailsTool,
  updateViewTool,
  deleteViewTool,
  getViewTasksTool,
  handleGetViews,
  handleCreateView,
  handleGetViewDetails,
  handleUpdateView,
  handleDeleteView,
  handleGetViewTasks,
} from "./tools/view.tools.js";
import { getTeamsTool, handleGetTeams } from "./tools/team.tools.js";
import {
  getListsTool,
  handleGetLists,
  createListTool,
  handleCreateList,
} from "./tools/list.tools.js";
import { createBoardTool, handleCreateBoard } from "./tools/board.tools.js";
import {
  getTaskCommentsTool,
  createTaskCommentTool,
  getListCommentsTool,
  updateCommentTool,
  deleteCommentTool,
  handleGetTaskComments,
  handleCreateTaskComment,
  handleGetListComments,
  handleUpdateComment,
  handleDeleteComment,
} from "./tools/comment.tools.js";
import {
  getSpaceTagsTool,
  addTagToTaskTool,
  removeTagFromTaskTool,
  handleGetSpaceTags,
  handleAddTagToTask,
  handleRemoveTagFromTask,
} from "./tools/tag.tools.js";
import {
  createTimeEntryTool,
  getTimeEntriesTool,
  deleteTimeEntryTool,
  handleCreateTimeEntry,
  handleGetTimeEntries,
  handleDeleteTimeEntry,
} from "./tools/time-tracking.tools.js";
import {
  addDependencyTool,
  deleteDependencyTool,
  handleAddDependency,
  handleDeleteDependency,
} from "./tools/dependency.tools.js";
import {
  addWatcherTool,
  removeWatcherTool,
  handleAddWatcher,
  handleRemoveWatcher,
} from "./tools/watcher.tools.js";
import {
  getGoalsTool,
  createGoalTool,
  updateGoalTool,
  deleteGoalTool,
  handleGetGoals,
  handleCreateGoal,
  handleUpdateGoal,
  handleDeleteGoal,
} from "./tools/goal.tools.js";
import {
  getWebhooksTool,
  createWebhookTool,
  deleteWebhookTool,
  handleGetWebhooks,
  handleCreateWebhook,
  handleDeleteWebhook,
} from "./tools/webhook.tools.js";
import {
  slackSendMessageTool,
  slackPostToChannelTool,
  handleSlackSendMessage,
  handleSlackPostToChannel,
} from "./tools/slack.tools.js";
import {
  discordSendWebhookMessageTool,
  handleDiscordSendWebhookMessage,
} from "./tools/discord.tools.js";
import {
  githubCreateIssueTool,
  githubAddCommentTool,
  handleGitHubCreateIssue,
  handleGitHubAddComment,
} from "./tools/github.tools.js";
import {
  emailSendEmailTool,
  handleSendEmail,
} from "./tools/email.tools.js";
import {
  listWorkflowTemplatesTool,
  deployTemplateTool,
  handleListWorkflowTemplates,
  handleDeployTemplate,
} from "./tools/template.tools.js";
import { startEngine } from "./engine/index.js";
import {
  createWorkflowTool,
  updateWorkflowTool,
  listWorkflowsTool,
  getWorkflowTool,
  deleteWorkflowTool,
  triggerWorkflowTool,
  enableWorkflowTool,
  disableWorkflowTool,
  getWorkflowRunsTool,
  handleCreateWorkflow,
  handleUpdateWorkflow,
  handleListWorkflows,
  handleGetWorkflow,
  handleDeleteWorkflow,
  handleTriggerWorkflow,
  handleEnableWorkflow,
  handleDisableWorkflow,
  handleGetWorkflowRuns,
} from "./tools/automation.tools.js";

// --- Token management MCP tools ---
const generateApiTokenTool: Tool = {
  name: "generate_api_token",
  description:
    "Generate a new API bearer token for a teammate to access this MCP server.",
  inputSchema: {
    type: "object" as const,
    properties: {
      user_name: {
        type: "string",
        description: "Name of the user this token is for",
      },
    },
    required: ["user_name"],
  },
};

const listApiTokensTool: Tool = {
  name: "list_api_tokens",
  description:
    "List all API tokens with user names and last-used timestamps.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

const revokeApiTokenTool: Tool = {
  name: "revoke_api_token",
  description: "Revoke an API token.",
  inputSchema: {
    type: "object" as const,
    properties: {
      token: {
        type: "string",
        description: "The token to revoke",
      },
    },
    required: ["token"],
  },
};

async function main() {
  try {
    logger.info("Starting ClickUp MCP Server (SSE mode)...");

    // Ensure at least one admin token exists
    ensureAdminToken();

    const clickUpService = new ClickUpService();
    startEngine();
    const serverOptions = {
      capabilities: {
        tools: {
          createTaskTool,
          updateTaskTool,
          getTeamsTool,
          getListsTool,
          createBoardTool,
          getSpacesTool,
          createSpaceTool,
          getSpaceTool,
          updateSpaceTool,
          deleteSpaceTool,
          getFoldersTool,
          createFolderTool,
          getFolderTool,
          updateFolderTool,
          deleteFolderTool,
          getCustomFieldsTool,
          setTaskCustomFieldValueTool,
          removeTaskCustomFieldValueTool,
          searchDocsTool,
          createDocTool,
          getDocPagesTool,
          createDocPageTool,
          getDocPageContentTool,
          editDocPageContentTool,
          getViewsTool,
          createViewTool,
          getViewDetailsTool,
          updateViewTool,
          deleteViewTool,
          getViewTasksTool,
          createListTool,
          getTaskCommentsTool,
          createTaskCommentTool,
          getListCommentsTool,
          updateCommentTool,
          deleteCommentTool,
          getSpaceTagsTool,
          addTagToTaskTool,
          removeTagFromTaskTool,
          createTimeEntryTool,
          getTimeEntriesTool,
          deleteTimeEntryTool,
          addDependencyTool,
          deleteDependencyTool,
          addWatcherTool,
          removeWatcherTool,
          getGoalsTool,
          createGoalTool,
          updateGoalTool,
          deleteGoalTool,
          getWebhooksTool,
          createWebhookTool,
          deleteWebhookTool,
          slackSendMessageTool,
          slackPostToChannelTool,
          discordSendWebhookMessageTool,
          githubCreateIssueTool,
          githubAddCommentTool,
          emailSendEmailTool,
          createWorkflowTool,
          updateWorkflowTool,
          listWorkflowsTool,
          getWorkflowTool,
          deleteWorkflowTool,
          triggerWorkflowTool,
          enableWorkflowTool,
          disableWorkflowTool,
          getWorkflowRunsTool,
          listWorkflowTemplatesTool,
          deployTemplateTool,
          generateApiTokenTool,
          listApiTokensTool,
          revokeApiTokenTool,
        },
      },
    };

    const server = new Server(
      { name: "ClickUp MCP Server", version: "1.1.5" },
      serverOptions,
    );

    // Handle ListTools
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolDefinitions: Tool[] = Object.values(
        serverOptions.capabilities.tools,
      );
      return { tools: toolDefinitions };
    });

    // Handle tool calls
    server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        logger.debug("Received tool request:", request);
        try {
          const args = request.params.arguments ?? {};
          switch (request.params.name) {
            case createTaskTool.name:
              return await handleCreateTask(clickUpService, args);
            case updateTaskTool.name:
              return await handleUpdateTask(clickUpService, args);
            case getSpacesTool.name:
              return await handleGetSpaces(clickUpService, args);
            case createSpaceTool.name:
              return await handleCreateSpace(clickUpService, args);
            case getSpaceTool.name:
              return await handleGetSpace(clickUpService, args);
            case updateSpaceTool.name:
              return await handleUpdateSpace(clickUpService, args);
            case deleteSpaceTool.name:
              return await handleDeleteSpace(clickUpService, args);
            case getFoldersTool.name:
              return await handleGetFolders(clickUpService, args);
            case createFolderTool.name:
              return await handleCreateFolder(clickUpService, args);
            case getFolderTool.name:
              return await handleGetFolder(clickUpService, args);
            case updateFolderTool.name:
              return await handleUpdateFolder(clickUpService, args);
            case deleteFolderTool.name:
              return await handleDeleteFolder(clickUpService, args);
            case getCustomFieldsTool.name:
              return await handleGetCustomFields(clickUpService, args);
            case setTaskCustomFieldValueTool.name:
              return await handleSetTaskCustomFieldValue(clickUpService, args);
            case removeTaskCustomFieldValueTool.name:
              return await handleRemoveTaskCustomFieldValue(
                clickUpService,
                args,
              );
            case searchDocsTool.name:
              return await handleSearchDocs(clickUpService, args);
            case createDocTool.name:
              return await handleCreateDoc(clickUpService, args);
            case getDocPagesTool.name:
              return await handleGetDocPages(clickUpService, args);
            case createDocPageTool.name:
              return await handleCreateDocPage(clickUpService, args);
            case getDocPageContentTool.name:
              return await handleGetDocPageContent(clickUpService, args);
            case editDocPageContentTool.name:
              return await handleEditDocPageContent(clickUpService, args);
            case getViewsTool.name:
              return await handleGetViews(clickUpService, args);
            case createViewTool.name:
              return await handleCreateView(clickUpService, args);
            case getViewDetailsTool.name:
              return await handleGetViewDetails(clickUpService, args);
            case updateViewTool.name:
              return await handleUpdateView(clickUpService, args);
            case deleteViewTool.name:
              return await handleDeleteView(clickUpService, args);
            case getViewTasksTool.name:
              return await handleGetViewTasks(clickUpService, args);
            case getTeamsTool.name:
              return await handleGetTeams(clickUpService, args);
            case getListsTool.name:
              return await handleGetLists(clickUpService, args);
            case createBoardTool.name:
              return await handleCreateBoard(clickUpService, args);
            case createListTool.name:
              return await handleCreateList(clickUpService, args);
            case getTaskCommentsTool.name:
              return await handleGetTaskComments(clickUpService, args);
            case createTaskCommentTool.name:
              return await handleCreateTaskComment(clickUpService, args);
            case getListCommentsTool.name:
              return await handleGetListComments(clickUpService, args);
            case updateCommentTool.name:
              return await handleUpdateComment(clickUpService, args);
            case deleteCommentTool.name:
              return await handleDeleteComment(clickUpService, args);
            case getSpaceTagsTool.name:
              return await handleGetSpaceTags(clickUpService, args);
            case addTagToTaskTool.name:
              return await handleAddTagToTask(clickUpService, args);
            case removeTagFromTaskTool.name:
              return await handleRemoveTagFromTask(clickUpService, args);
            case createTimeEntryTool.name:
              return await handleCreateTimeEntry(clickUpService, args);
            case getTimeEntriesTool.name:
              return await handleGetTimeEntries(clickUpService, args);
            case deleteTimeEntryTool.name:
              return await handleDeleteTimeEntry(clickUpService, args);
            case addDependencyTool.name:
              return await handleAddDependency(clickUpService, args);
            case deleteDependencyTool.name:
              return await handleDeleteDependency(clickUpService, args);
            case addWatcherTool.name:
              return await handleAddWatcher(clickUpService, args);
            case removeWatcherTool.name:
              return await handleRemoveWatcher(clickUpService, args);
            case getGoalsTool.name:
              return await handleGetGoals(clickUpService, args);
            case createGoalTool.name:
              return await handleCreateGoal(clickUpService, args);
            case updateGoalTool.name:
              return await handleUpdateGoal(clickUpService, args);
            case deleteGoalTool.name:
              return await handleDeleteGoal(clickUpService, args);
            case getWebhooksTool.name:
              return await handleGetWebhooks(clickUpService, args);
            case createWebhookTool.name:
              return await handleCreateWebhook(clickUpService, args);
            case deleteWebhookTool.name:
              return await handleDeleteWebhook(clickUpService, args);

            // --- Integration Cases (standalone, no clickUpService) ---
            case slackSendMessageTool.name:
              return await handleSlackSendMessage(args);
            case slackPostToChannelTool.name:
              return await handleSlackPostToChannel(args);
            case discordSendWebhookMessageTool.name:
              return await handleDiscordSendWebhookMessage(args);
            case githubCreateIssueTool.name:
              return await handleGitHubCreateIssue(args);
            case githubAddCommentTool.name:
              return await handleGitHubAddComment(args);
            case emailSendEmailTool.name:
              return await handleSendEmail(args);

            // --- Automation Cases (standalone, use engine store/executor) ---
            case createWorkflowTool.name:
              return await handleCreateWorkflow(args);
            case updateWorkflowTool.name:
              return await handleUpdateWorkflow(args);
            case listWorkflowsTool.name:
              return await handleListWorkflows(args);
            case getWorkflowTool.name:
              return await handleGetWorkflow(args);
            case deleteWorkflowTool.name:
              return await handleDeleteWorkflow(args);
            case triggerWorkflowTool.name:
              return await handleTriggerWorkflow(args);
            case enableWorkflowTool.name:
              return await handleEnableWorkflow(args);
            case disableWorkflowTool.name:
              return await handleDisableWorkflow(args);
            case getWorkflowRunsTool.name:
              return await handleGetWorkflowRuns(args);

            // --- Template Cases ---
            case listWorkflowTemplatesTool.name:
              return await handleListWorkflowTemplates(args);
            case deployTemplateTool.name:
              return await handleDeployTemplate(args);

            // Token management tools
            case generateApiTokenTool.name: {
              const userName = args.user_name as string;
              const token = generateToken(userName);
              return {
                content: [
                  {
                    type: "text",
                    text: `Token generated for ${userName}: ${token}`,
                  },
                ],
              };
            }
            case listApiTokensTool.name: {
              const tokens = listTokens();
              const masked = tokens.map((t) => ({
                ...t,
                token: t.token.slice(0, 8) + "..." + t.token.slice(-4),
              }));
              return {
                content: [
                  { type: "text", text: JSON.stringify(masked, null, 2) },
                ],
              };
            }
            case revokeApiTokenTool.name: {
              const success = revokeToken(args.token as string);
              return {
                content: [
                  {
                    type: "text",
                    text: success ? "Token revoked." : "Token not found.",
                  },
                ],
              };
            }

            default:
              throw new Error(`Unknown tool: ${request.params.name}`);
          }
        } catch (error) {
          logger.error("Error handling tool request:", error);
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown error occurred";
          return {
            content: [{ type: "text", text: `Error: ${errorMessage}` }],
          };
        }
      },
    );

    // --- Express app for SSE transport ---
    const app = express();

    // Track active SSE transports by sessionId
    const transports = new Map<string, SSEServerTransport>();

    // Health check (no auth)
    app.get("/health", (_req, res) => {
      res.json({ status: "ok", transport: "sse", version: "1.1.5" });
    });

    // SSE endpoint — auth required
    app.get("/sse", bearerAuthMiddleware, async (req, res) => {
      logger.info("New SSE connection");
      const transport = new SSEServerTransport(
        "/messages",
        res as unknown as ServerResponse,
      );
      transports.set(transport.sessionId, transport);

      transport.onclose = () => {
        transports.delete(transport.sessionId);
        logger.info("SSE connection closed, session:", transport.sessionId);
      };

      await server.connect(transport);
    });

    // Message endpoint — auth required
    app.post("/messages", bearerAuthMiddleware, async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const transport = transports.get(sessionId);
      if (!transport) {
        res.status(400).json({ error: "Unknown session" });
        return;
      }
      await transport.handlePostMessage(
        req as unknown as IncomingMessage,
        res as unknown as ServerResponse,
      );
    });

    const port = config.server.port;
    const httpServer = app.listen(port, () => {
      logger.info(`MCP SSE server listening on http://0.0.0.0:${port}`);
      logger.info(`  SSE endpoint: GET /sse`);
      logger.info(`  Messages:     POST /messages`);
      logger.info(`  Health:       GET /health`);
    });
    httpServer.on("listening", () => {
      const addr = httpServer.address();
      if (addr && typeof addr === "object") {
        logger.info(`Bound to ${addr.address}:${addr.port}`);
      }
    });
  } catch (error) {
    logger.error("Failed to start ClickUp MCP Server:", error);
    process.exit(1);
  }
}

main();
