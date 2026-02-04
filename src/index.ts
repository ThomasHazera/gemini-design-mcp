#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";

// Load environment variables
config();

// Create MCP server
const server = new McpServer({
  name: "gemini-design-mcp",
  version: "0.1.0",
});

// Placeholder for tools (will be added in next phases)
// server.tool(...) will be registered here

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini Design MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
