# gemini-design-mcp

MCP server for frontend code generation via Google Gemini API with built-in CRO (Conversion Rate Optimization) principles.

## Features

- **5 MCP Tools** for frontend development
- **CRO-first design** - All generated code follows conversion optimization principles
- **Multi-framework support** - React, Vue, Svelte, HTML
- **CSS flexibility** - Tailwind, shadcn/ui, vanilla CSS
- **Design system integration** - Generate and use consistent design tokens

## Installation

```bash
git clone https://github.com/ThomasHazera/gemini-design-mcp.git
cd gemini-design-mcp
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env
```

## Usage with Claude Code

```bash
claude mcp add gemini-design -e GEMINI_API_KEY=your_key -- npx tsx /path/to/gemini-design-mcp/src/index.ts
```

Then restart Claude Code to load the MCP.

## Available Tools

### 1. `gemini_create_frontend`

Generate complete pages or views.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `description` | string | required | What to create |
| `framework` | enum | `react` | react, html, vue, svelte |
| `cssFramework` | enum | `tailwind` | tailwind, css, shadcn |
| `designSystemPath` | string | optional | Path to design-system.md |
| `model` | enum | `gemini-2.5-flash` | Gemini model |
| `responsive` | boolean | `true` | Mobile-first design |
| `accessibility` | boolean | `true` | WCAG 2.1 AA |
| `applyCroPrinciples` | boolean | `true` | Apply CRO guidelines |

### 2. `gemini_snippet_frontend`

Generate isolated, reusable components.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `componentType` | string | required | modal, card, form, table, navbar, etc. |
| `description` | string | required | Component specs |
| `framework` | enum | `react` | Target framework |
| `cssFramework` | enum | `tailwind` | CSS approach |
| `designSystemPath` | string | optional | Design system file |
| `model` | enum | `gemini-2.5-flash` | Gemini model |
| `applyCroPrinciples` | boolean | `true` | Apply CRO guidelines |

### 3. `gemini_modify_frontend`

Modify existing frontend code.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `filePath` | string | required | File to modify |
| `instruction` | string | required | What changes to make |
| `framework` | enum | `react` | File's framework |
| `model` | enum | `gemini-2.5-flash` | Gemini model |

### 4. `gemini_cro_review`

Audit UI code for CRO issues.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `filePath` | string | optional | File to analyze |
| `code` | string | optional | Code to analyze directly |
| `model` | enum | `gemini-2.5-flash` | Gemini model |

**Returns:** Score (0-100), issues with severity (critical/major/minor), actionable suggestions.

### 5. `gemini_design_system`

Generate a complete design system.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `projectDescription` | string | required | Project context |
| `style` | string | optional | minimal, corporate, playful, etc. |
| `existingCssPath` | string | optional | Existing CSS to analyze |
| `framework` | enum | `react` | Target framework |
| `cssFramework` | enum | `tailwind` | CSS approach |
| `model` | enum | `gemini-2.5-pro` | Pro recommended |
| `includeCroPrinciples` | boolean | `true` | Include CRO patterns |

## CRO Principles

All generated code follows these user-first principles:

1. **Time-to-Value** - Remove friction, one goal per session
2. **Action > Explanation** - Interactive over passive learning
3. **Progress Visibility** - Show advancement, celebrate completions
4. **Empty States** - Guide to first action, never leave blank
5. **Guided Tours** - Max 3-5 steps, always dismissible
6. **Activation Focus** - Design for the "aha moment"

Source: [onboarding-cro skill](https://skills.sh/coreyhaines31/marketingskills/onboarding-cro)

## Models & Pricing

| Model | Use Case | Cost (approx) |
|-------|----------|---------------|
| `gemini-2.5-flash` | Default, fast | ~$0.15/1M tokens |
| `gemini-2.5-pro` | Design systems, complex pages | ~$1.25/1M tokens |
| `gemini-2.0-flash-lite` | Budget option | ~$0.075/1M tokens |
| `gemini-3-flash-preview` | Premium visual - dashboard, onboarding, landing pages | ~$0.50/$3 per 1M tokens |

## Development

```bash
npm run build    # Compile TypeScript
npm run dev      # Run in dev mode
```

## License

MIT
