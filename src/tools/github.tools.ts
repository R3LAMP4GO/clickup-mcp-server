import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GitHubService } from "../services/integrations/github.service.js";
import { logger } from "../logger.js";

export const githubCreateIssueTool: Tool = {
  name: "github_create_issue",
  description: "Create a new issue in a GitHub repository.",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "The GitHub repository owner (user or organization).",
      },
      repo: {
        type: "string",
        description: "The GitHub repository name.",
      },
      title: {
        type: "string",
        description: "The title of the issue.",
      },
      body: {
        type: "string",
        description: "Optional body/description of the issue.",
      },
    },
    required: ["owner", "repo", "title"],
  },
};

export const githubAddCommentTool: Tool = {
  name: "github_add_comment",
  description: "Add a comment to an existing GitHub issue or pull request.",
  inputSchema: {
    type: "object",
    properties: {
      owner: {
        type: "string",
        description: "The GitHub repository owner (user or organization).",
      },
      repo: {
        type: "string",
        description: "The GitHub repository name.",
      },
      issue_number: {
        type: "number",
        description: "The issue or pull request number.",
      },
      body: {
        type: "string",
        description: "The comment body text.",
      },
    },
    required: ["owner", "repo", "issue_number", "body"],
  },
};

export async function handleGitHubCreateIssue(
  args: Record<string, unknown>,
): Promise<any> {
  logger.info(`Handling tool call: ${githubCreateIssueTool.name}`);
  try {
    const service = new GitHubService();
    const result = await service.createIssue(
      args.owner as string,
      args.repo as string,
      args.title as string,
      args.body as string | undefined,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    logger.error(`Error in ${githubCreateIssueTool.name}:`, error);
    throw error instanceof Error
      ? error
      : new Error("Failed to create GitHub issue");
  }
}

export async function handleGitHubAddComment(
  args: Record<string, unknown>,
): Promise<any> {
  logger.info(`Handling tool call: ${githubAddCommentTool.name}`);
  try {
    const service = new GitHubService();
    const result = await service.addComment(
      args.owner as string,
      args.repo as string,
      args.issue_number as number,
      args.body as string,
    );
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    logger.error(`Error in ${githubAddCommentTool.name}:`, error);
    throw error instanceof Error
      ? error
      : new Error("Failed to add GitHub comment");
  }
}
