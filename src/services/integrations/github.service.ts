import { Octokit } from "@octokit/rest";
import { config } from "../../config/app.config.js";
import { logger } from "../../logger.js";

export class GitHubService {
  private client: Octokit;

  constructor() {
    if (!config.githubToken) {
      throw new Error("GITHUB_TOKEN is not configured");
    }
    this.client = new Octokit({ auth: config.githubToken });
  }

  async createIssue(
    owner: string,
    repo: string,
    title: string,
    body?: string,
  ): Promise<any> {
    logger.info(`Creating GitHub issue in ${owner}/${repo}: ${title}`);
    const result = await this.client.issues.create({
      owner,
      repo,
      title,
      body,
    });
    return result.data;
  }

  async addComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string,
  ): Promise<any> {
    logger.info(
      `Adding comment to GitHub issue ${owner}/${repo}#${issueNumber}`,
    );
    const result = await this.client.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body,
    });
    return result.data;
  }
}
