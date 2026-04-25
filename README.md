# gemini-design-mcp

MCP server for frontend code generation via Google Gemini API with built-in CRO (Conversion Rate Optimization) principles.

## Why a dedicated MCP for frontend generation?

Generating production-grade frontend with an LLM orchestrator requires a lot of *implicit* knowledge: framework conventions, accessibility rules, CRO patterns, design tokens, and the right model for the visual stakes of each interface. Cramming all of that into your orchestrator's prompts works for a toy app — on a real project it eats the context window and quietly degrades reasoning quality.

This MCP is built to slot into orchestrator-driven workflows like Claude Code, and solves four concrete pains:

### 1. Zero prompt duplication across projects

System prompts, CRO principles, framework guidelines and model-selection logic live **here**, versioned with the server. Your project doesn't carry them, and you don't paste them into every new repo. Update the MCP once → every project benefits. The orchestrator just calls a tool — it doesn't need to know *how* good frontend gets generated.

### 2. The orchestrator's context stays clean

Calling `gemini_create_frontend` costs your orchestrator a single tool call — not 2k tokens of frontend best-practices, not a copy of your design system, not the generated output dumped back inline. The heavy lifting (large system prompts, design-system content, full code generation) happens inside Gemini's context, not Claude's. Your orchestrator stays under the 40% context-usage threshold for longer, which keeps planning quality and tool-selection accuracy high.

### 3. Model arbitration without contaminating the orchestrator

The MCP exposes a tier system (Budget / Standard / Quality / Premium — see [Model Selection Guide](#model-selection-guide)). The orchestrator says *what* to build; the MCP decides *which* Gemini model fits the visual stakes. Switching from `gemini-2.5-flash` to `gemini-3-pro` for a hero page is a parameter change, not a prompt refactor. New models drop in by updating the enum once, here.

### 4. Structured, pipeline-friendly output

`gemini_design_system` produces files compliant with the [Google Labs DESIGN.md spec](https://github.com/google-labs-code/design.md) — directly lintable, exportable to Tailwind / DTCG tokens, and readable by downstream agents. `gemini_cro_review` returns JSON with score, issues and suggestions — not prose to re-parse. The MCP behaves like a node in your build pipeline, not a black box.

### Where it fits in a Claude Code orchestrator

```
Claude Code orchestrator (lightweight, stays in planning mode)
    │
    ├── @ui-architect          (specifies UI, owns DESIGN.md)
    │
    ├── gemini-design-mcp      ← this server (heavy lifting isolated here)
    │     ├── gemini_design_system    (DESIGN.md generation)
    │     ├── gemini_create_frontend  (pages / views)
    │     ├── gemini_snippet_frontend (reusable components)
    │     ├── gemini_modify_frontend  (edits existing UI)
    │     └── gemini_cro_review       (conversion audit)
    │
    ├── @developer             (wires business logic onto generated UI)
    └── @reviewer              (gatekeeps before merge)
```

The MCP owns *what good frontend looks like*. Your orchestrator owns *what to build and why*. That separation is what makes the setup scale across multiple large projects without each of them dragging a copy of the rules.

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

## Model Selection Guide

**Rule of thumb**: match the model to the **visual stakes** of the interface.
The most powerful model available (`gemini-3-flash-preview` today) should be used
for interfaces that carry the overall feel of the product or where visual quality
directly impacts conversion / retention.

### Tiers

| Tier | Model | Cost (approx) | Use for |
|------|-------|---------------|---------|
| Budget | `gemini-2.0-flash-lite` | ~$0.075/1M tokens | Quick fixes, minor text changes |
| Standard | `gemini-2.5-flash` | ~$0.15/1M tokens | **Default** — forms, admin, CRUD, settings |
| Quality | `gemini-2.5-pro` | ~$1.25/1M tokens | Design system generation, architectural consistency |
| Premium | `gemini-3-flash-preview` | ~$0.50/$3 per 1M tokens | **Hero interfaces** — dashboard, onboarding, landing, conversion pages, main data viz |

### Decision Matrix

| Interface type | Recommended model | Rationale |
|----------------|-------------------|-----------|
| Main dashboard | `gemini-3-flash-preview` | First impression, daily use |
| Onboarding / first-run | `gemini-3-flash-preview` | Conversion critical |
| Landing / marketing page | `gemini-3-flash-preview` | Public-facing, brand image |
| Data visualization (hero) | `gemini-3-flash-preview` | Complex, high user value |
| Design system generation | `gemini-2.5-pro` | Architectural consistency across the app |
| Settings / profile | `gemini-2.5-flash` | Utility, low visual stakes |
| Admin panel | `gemini-2.5-flash` | Internal, functional focus |
| Forms (CRUD) | `gemini-2.5-flash` | Standard patterns |
| Modal / toast / alert | `gemini-2.5-flash` | Small, reusable |
| Simple component fix | `gemini-2.0-flash-lite` | Quick iteration |

> If unspecified, all tools default to `gemini-2.5-flash`. Pass `model: "gemini-3-flash-preview"` explicitly when the interface is a hero surface for the product.

> **Note** — once the `@google/genai` SDK migration lands, the Premium tier will move from `gemini-3-flash-preview` (preview) to `gemini-3-pro` (GA) and defaults for `gemini_design_system` / `gemini_create_frontend` will shift accordingly.

## Development

```bash
npm run build    # Compile TypeScript
npm run dev      # Run in dev mode
```

## License

MIT
