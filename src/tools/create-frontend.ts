import { z } from "zod";
import { getGeminiClient } from "../gemini/client.js";
import { buildCreateFrontendPrompt } from "../gemini/prompts.js";
import type { Framework, CssFramework, GeminiModel } from "../types.js";

// Zod schema for tool input validation
export const createFrontendSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .describe("Description of the page/view to create"),
  framework: z
    .enum(["react", "html", "vue", "svelte"])
    .default("react")
    .describe("Frontend framework to use"),
  cssFramework: z
    .enum(["tailwind", "css", "shadcn"])
    .default("tailwind")
    .describe("CSS framework/approach to use"),
  designSystemPath: z
    .string()
    .optional()
    .describe("Path to design-system.md file (optional)"),
  model: z
    .enum(["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash-lite"])
    .default("gemini-2.5-flash")
    .describe("Gemini model to use"),
  responsive: z
    .boolean()
    .default(true)
    .describe("Generate responsive design"),
  accessibility: z
    .boolean()
    .default(true)
    .describe("Include accessibility features (WCAG 2.1 AA)"),
  applyCroPrinciples: z
    .boolean()
    .default(true)
    .describe("Apply CRO/user-first principles to the generated code"),
});

export type CreateFrontendInput = z.infer<typeof createFrontendSchema>;

/**
 * Load design system from file if path provided
 */
async function loadDesignSystem(path?: string): Promise<string | undefined> {
  if (!path) return undefined;

  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(path, "utf-8");
    return content;
  } catch (error) {
    console.error(`Warning: Could not load design system from ${path}:`, error);
    return undefined;
  }
}

/**
 * Execute the create-frontend tool
 */
export async function executeCreateFrontend(
  input: CreateFrontendInput
): Promise<{ code: string; language: string; message: string }> {
  const client = getGeminiClient();

  // Load design system if provided
  const designSystem = await loadDesignSystem(input.designSystemPath);

  // Build the prompt
  const prompt = buildCreateFrontendPrompt({
    description: input.description,
    framework: input.framework as Framework,
    cssFramework: input.cssFramework as CssFramework,
    designSystem,
    applyCroPrinciples: input.applyCroPrinciples,
    responsive: input.responsive,
    accessibility: input.accessibility,
  });

  // Call Gemini API
  const response = await client.generateContent(prompt, {
    model: input.model as GeminiModel,
    temperature: 0.7,
    maxOutputTokens: 8192,
  });

  // Extract code from response
  const codeBlocks = client.extractCode(response);

  if (codeBlocks.length === 0) {
    // If no code blocks found, return the raw response
    return {
      code: response,
      language: input.framework === "react" ? "tsx" : input.framework,
      message: "Generated code (no code blocks detected, returning raw response)",
    };
  }

  // Return the first (main) code block
  const mainCode = codeBlocks[0];

  return {
    code: mainCode.code,
    language: mainCode.language,
    message: `Generated ${input.framework} component with ${input.cssFramework}${input.applyCroPrinciples ? " (CRO optimized)" : ""}`,
  };
}

/**
 * Tool metadata for MCP registration
 */
export const createFrontendToolMeta = {
  name: "gemini_create_frontend",
  description: `Generate complete frontend pages or views using Google Gemini.

Features:
- Multiple frameworks: React, HTML, Vue, Svelte
- CSS options: Tailwind, CSS, shadcn/ui
- Built-in CRO principles for conversion optimization
- Responsive design by default
- WCAG 2.1 AA accessibility
- Optional design system integration

Returns production-ready code with no placeholders.`,
  inputSchema: createFrontendSchema,
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};
