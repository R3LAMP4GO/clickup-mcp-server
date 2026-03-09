#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { ClickUpService } from "./services/clickup.service.js";
import { config } from "./config/app.config.js";
import { logger } from "./logger.js";
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
  // View Types (import only needed types here)
  // ClickUpView, GetViewsParams, ClickUpViewParentType, CreateViewParams, ...
  ClickUpViewParentType,
  ClickUpViewType,
} from "./types.js";
// Import tool definitions and handlers
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
// Import NEW tools/handlers
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

// Tool Schemas - REMOVE taskSchema definition if only used in task.tools.ts
const commonIdDescription =
  "The unique identifier for the resource in ClickUp.";
const teamIdDescription = "The ID of the Workspace (Team) to operate on.";
const spaceIdDescription = "The ID of the Space to operate on.";
const folderIdDescription = "The ID of the Folder to operate on.";
const archivedDescription =
  "Whether to include archived items (true or false).";

// Tool Definitions - REMOVE createTaskTool and updateTaskTool
// const createTaskTool: Tool = { ... };
// const updateTaskTool: Tool = { ... };

// Keep main function structure
async function main() {
  try {
    logger.info("Starting ClickUp MCP Server...");
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
        },
      },
    };
    const server = new Server(
      {
        name: "ClickUp MCP Server",
        version: "1.0.0",
      },
      serverOptions,
    );

    // Handle ListTools request
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      // The 'tools' object within serverOptions.capabilities.tools
      // is an object where keys are the shorthand property names (e.g., "createTaskTool")
      // and values are the actual Tool definition objects.
      // Object.values() will give an array of these Tool definition objects.
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
            // ... (cases for tasks, spaces, folders, custom fields, docs, views) ...
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

            // --- Refactored Cases ---
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

    // Explicitly create and connect the Stdio transport
    const transport = new StdioServerTransport();
    server.connect(transport);
    logger.info(
      "ClickUp MCP Server started successfully and listening via Stdio.",
    );
  } catch (error) {
    logger.error("Failed to start ClickUp MCP Server:", error);
    process.exit(1); // Exit with error code
  }
}

main();
