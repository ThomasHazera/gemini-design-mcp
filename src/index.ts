#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import {
  createFrontendSchema,
  executeCreateFrontend,
  createFrontendToolMeta,
} from "./tools/create-frontend.js";
import {
  snippetFrontendSchema,
  executeSnippetFrontend,
  snippetFrontendToolMeta,
} from "./tools/snippet-frontend.js";
import {
  modifyFrontendSchema,
  executeModifyFrontend,
  modifyFrontendToolMeta,
} from "./tools/modify-frontend.js";
import {
  croReviewSchema,
  executeCroReview,
  croReviewToolMeta,
} from "./tools/cro-review.js";
import {
  designSystemSchema,
  executeDesignSystem,
  designSystemToolMeta,
} from "./tools/design-system.js";

// Load environment variables
config();

// Create MCP server
const server = new McpServer({
  name: "gemini-design-mcp",
  version: "0.1.0",
});

// Register gemini_create_frontend tool
server.tool(
  createFrontendToolMeta.name,
  createFrontendToolMeta.description,
  createFrontendSchema.shape,
  async (params) => {
    try {
      const validated = createFrontendSchema.parse(params);
      const result = await executeCreateFrontend(validated);

      return {
        content: [
          {
            type: "text",
            text: `${result.message}\n\n\`\`\`${result.language}\n${result.code}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Error generating frontend: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register gemini_snippet_frontend tool
server.tool(
  snippetFrontendToolMeta.name,
  snippetFrontendToolMeta.description,
  snippetFrontendSchema.shape,
  async (params) => {
    try {
      const validated = snippetFrontendSchema.parse(params);
      const result = await executeSnippetFrontend(validated);

      return {
        content: [
          {
            type: "text",
            text: `${result.message}\n\n\`\`\`${result.language}\n${result.code}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Error generating snippet: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register gemini_modify_frontend tool
server.tool(
  modifyFrontendToolMeta.name,
  modifyFrontendToolMeta.description,
  modifyFrontendSchema.shape,
  async (params) => {
    try {
      const validated = modifyFrontendSchema.parse(params);
      const result = await executeModifyFrontend(validated);

      return {
        content: [
          {
            type: "text",
            text: `${result.message}\n\n\`\`\`${result.language}\n${result.code}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Error modifying frontend: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register gemini_cro_review tool
server.tool(
  croReviewToolMeta.name,
  croReviewToolMeta.description,
  croReviewSchema.shape,
  async (params) => {
    try {
      const validated = croReviewSchema.parse(params);
      const { result, summary } = await executeCroReview(validated);

      // Format the issues
      const issuesText = result.issues.length > 0
        ? result.issues.map(
            (issue, idx) =>
              `${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.principle}\n` +
              `   Location: ${issue.location}\n` +
              `   ${issue.description}`
          ).join("\n\n")
        : "No issues found.";

      // Format the suggestions
      const suggestionsText = result.suggestions.length > 0
        ? result.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join("\n")
        : "No suggestions.";

      const fullReport = `${summary}\n\n## Issues Found\n${issuesText}\n\n## Suggestions\n${suggestionsText}`;

      return {
        content: [
          {
            type: "text",
            text: fullReport,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing CRO: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Register gemini_design_system tool
server.tool(
  designSystemToolMeta.name,
  designSystemToolMeta.description,
  designSystemSchema.shape,
  async (params) => {
    try {
      const validated = designSystemSchema.parse(params);
      const result = await executeDesignSystem(validated);

      return {
        content: [
          {
            type: "text",
            text: `${result.message}\n\n${result.content}`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [
          {
            type: "text",
            text: `Error generating design system: ${message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini Design MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
