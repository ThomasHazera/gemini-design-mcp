# gemini-design-mcp

MCP server for frontend code generation via Google Gemini API with built-in CRO principles.

## Installation

```bash
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env
```

## Usage with Claude Code

```bash
claude mcp add gemini-design --env GEMINI_API_KEY=your_key -- npx tsx /path/to/gemini-design-mcp/src/index.ts
```

## Available Tools

- `gemini_create_frontend` - Create complete pages/views (coming soon)
- `gemini_snippet_frontend` - Generate isolated components (coming soon)
- `gemini_modify_frontend` - Edit existing components (coming soon)
- `gemini_design_system` - Generate design systems (coming soon)
- `gemini_cro_review` - Audit UI for CRO issues (coming soon)

## CRO Principles

All generated code follows these user-first principles:
- Time-to-Value: Remove friction, one goal per session
- Action > Explanation: Interactive over passive learning
- Progress Visibility: Show advancement, celebrate completions
- Empty States: Guide to first action, never leave blank
- Guided Tours: Max 3-5 steps, always dismissible

## License

MIT
