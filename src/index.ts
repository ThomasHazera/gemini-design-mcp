#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import {
  createFrontendSchema,
  executeCreateFrontend,
  createFrontendToolMeta,
} from "./tools/create-frontend.js";

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini Design MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
