import type { Framework, CssFramework } from "../types.js";

/**
 * CRO (Conversion Rate Optimization) principles from onboarding-cro skill
 * Source: https://skills.sh/coreyhaines31/marketingskills/onboarding-cro
 */
export const CRO_PRINCIPLES = `
## CRO/User-First Principles (MANDATORY)

Apply these conversion-focused principles to ALL generated UI code:

### 1. Time-to-Value
- Remove friction between signup and experiencing core value
- One goal per session for first-time users
- Minimize steps to the "aha moment"
- Never overwhelm with features upfront

### 2. Action Over Explanation
- "Doing the thing > Learning about the thing"
- Interactive experiences beat documentation walls
- Inline contextual hints over lengthy tutorials
- Let users discover by doing

### 3. Progress Visibility
- Show advancement with progress bars, step indicators
- Celebrate completions (micro-animations, success states)
- Make the path visible - users should know where they are
- Checklists should have 3-7 items, ordered by importance

### 4. Empty States (Critical)
- NEVER leave a blank screen - always guide to first action
- Include clear, prominent CTA in every empty state
- Consider demo data or sample content when appropriate
- Empty state is a conversion opportunity, not a dead end

### 5. Guided Tours
- Maximum 3-5 steps, never more
- ALWAYS include visible "Skip" or "Dismiss" option
- Contextual tooltips preferred over modal tutorials
- Trigger-based, not time-based

### 6. Activation Focus
- Design for the earliest action that correlates with retention
- Highlight the critical path visually
- Remove distractions from the activation flow
- Make the primary CTA unmistakably obvious
`;

/**
 * Base system prompt for frontend generation
 */
export function buildSystemPrompt(options: {
  framework: Framework;
  cssFramework: CssFramework;
  applyCroPrinciples: boolean;
  responsive: boolean;
  accessibility: boolean;
}): string {
  const { framework, cssFramework, applyCroPrinciples, responsive, accessibility } = options;

  let prompt = `You are a senior frontend developer specialized in ${framework} and ${cssFramework}.
You write production-ready code that is clean, well-structured, and follows best practices.

## Output Requirements
- Generate ONLY code, no explanations unless asked
- Code must be complete and runnable - NO placeholders like "// TODO" or "..."
- Use semantic HTML elements
- Include all necessary imports
- Use TypeScript if framework supports it (React, Vue 3, Svelte)
`;

  if (responsive) {
    prompt += `
## Responsive Design
- Mobile-first approach
- Use responsive utilities (Tailwind: sm:, md:, lg:, xl:)
- Test breakpoints: 320px, 768px, 1024px, 1440px
- Touch-friendly targets (min 44x44px)
`;
  }

  if (accessibility) {
    prompt += `
## Accessibility (WCAG 2.1 AA)
- Proper heading hierarchy (h1 > h2 > h3)
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast ratio 4.5:1 minimum
- Focus indicators visible
`;
  }

  if (applyCroPrinciples) {
    prompt += `
${CRO_PRINCIPLES}
`;
  }

  return prompt;
}

/**
 * Build prompt for creating a frontend page/component
 */
export function buildCreateFrontendPrompt(options: {
  description: string;
  framework: Framework;
  cssFramework: CssFramework;
  designSystem?: string;
  applyCroPrinciples: boolean;
  responsive: boolean;
  accessibility: boolean;
}): string {
  const systemPrompt = buildSystemPrompt({
    framework: options.framework,
    cssFramework: options.cssFramework,
    applyCroPrinciples: options.applyCroPrinciples,
    responsive: options.responsive,
    accessibility: options.accessibility,
  });

  let prompt = systemPrompt;

  if (options.designSystem) {
    prompt += `
## Project Design System
Follow these design tokens and patterns:

${options.designSystem}
`;
  }

  prompt += `
## Task
Create the following:

${options.description}

## Response Format
Return the code in a single markdown code block with the appropriate language tag.
For React components, use \`\`\`tsx
For HTML, use \`\`\`html
For Vue, use \`\`\`vue
For Svelte, use \`\`\`svelte
`;

  return prompt;
}

/**
 * Build prompt for modifying existing code
 */
export function buildModifyFrontendPrompt(options: {
  existingCode: string;
  instruction: string;
  framework: Framework;
}): string {
  return `You are modifying existing ${options.framework} code.

## Existing Code
\`\`\`
${options.existingCode}
\`\`\`

## Modification Required
${options.instruction}

## Rules
- Keep the overall structure intact unless explicitly asked to change it
- Preserve existing functionality
- Only change what is necessary to fulfill the instruction
- Return the COMPLETE modified file, not just the changes

## Response Format
Return the complete modified code in a markdown code block.
`;
}

/**
 * Build prompt for generating a snippet/component
 */
export function buildSnippetPrompt(options: {
  componentType: string;
  description: string;
  framework: Framework;
  cssFramework: CssFramework;
  designSystem?: string;
  applyCroPrinciples: boolean;
}): string {
  const systemPrompt = buildSystemPrompt({
    framework: options.framework,
    cssFramework: options.cssFramework,
    applyCroPrinciples: options.applyCroPrinciples,
    responsive: true,
    accessibility: true,
  });

  let prompt = systemPrompt;

  if (options.designSystem) {
    prompt += `
## Project Design System
${options.designSystem}
`;
  }

  prompt += `
## Task
Create a reusable ${options.componentType} component:

${options.description}

## Component Requirements
- Self-contained and reusable
- Well-typed props (TypeScript)
- No external dependencies beyond the framework and CSS framework
- Include default props where sensible
- Export as named export

## Response Format
Return the component in a markdown code block.
`;

  return prompt;
}

/**
 * Build prompt for CRO review of existing code
 */
export function buildCroReviewPrompt(existingCode: string): string {
  return `You are a CRO (Conversion Rate Optimization) and UX expert.

Analyze the following frontend code and identify issues based on these principles:

${CRO_PRINCIPLES}

## Code to Analyze
\`\`\`
${existingCode}
\`\`\`

## Analysis Required
Evaluate the code against each CRO principle and provide:

1. **Score** (0-100): Overall CRO compliance score
2. **Issues**: List of problems found, each with:
   - principle: Which CRO principle is violated
   - description: What the issue is
   - severity: "critical" | "major" | "minor"
   - location: Where in the code (component/line hint)
3. **Suggestions**: Actionable improvements, ordered by impact

## Response Format
Return a JSON object:
\`\`\`json
{
  "score": number,
  "issues": [
    {
      "principle": string,
      "description": string,
      "severity": "critical" | "major" | "minor",
      "location": string
    }
  ],
  "suggestions": [string]
}
\`\`\`
`;
}
