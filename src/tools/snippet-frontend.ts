import { z } from "zod";
import { getGeminiClient } from "../gemini/client.js";
import { buildSnippetPrompt } from "../gemini/prompts.js";
import type { Framework, CssFramework, GeminiModel } from "../types.js";

export const snippetFrontendSchema = z.object({
  componentType: z
    .string()
    .min(2, "Component type required")
    .describe("Type of component: modal, card, form, table, navbar, footer, hero, etc."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .describe("Detailed specs for the component"),
  framework: z
    .enum(["react", "html", "vue", "svelte"])
    .default("react")
    .describe("Frontend framework"),
  cssFramework: z
    .enum(["tailwind", "css", "shadcn"])
    .default("tailwind")
    .describe("CSS framework"),
  designSystemPath: z
    .string()
    .optional()
    .describe("Path to design-system.md"),
  model: z
    .enum(["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash-lite"])
    .default("gemini-2.5-flash")
    .describe("Gemini model"),
  applyCroPrinciples: z
    .boolean()
    .default(true)
    .describe("Apply CRO principles"),
});

export type SnippetFrontendInput = z.infer<typeof snippetFrontendSchema>;

async function loadDesignSystem(path?: string): Promise<string | undefined> {
  if (!path) return undefined;
  try {
    const fs = await import("fs/promises");
    return await fs.readFile(path, "utf-8");
  } catch {
    return undefined;
  }
}

export async function executeSnippetFrontend(
  input: SnippetFrontendInput
): Promise<{ code: string; language: string; message: string }> {
  const client = getGeminiClient();
  const designSystem = await loadDesignSystem(input.designSystemPath);

  const prompt = buildSnippetPrompt({
    componentType: input.componentType,
    description: input.description,
    framework: input.framework as Framework,
    cssFramework: input.cssFramework as CssFramework,
    designSystem,
    applyCroPrinciples: input.applyCroPrinciples,
  });

  const response = await client.generateContent(prompt, {
    model: input.model as GeminiModel,
  });

  const codeBlocks = client.extractCode(response);

  if (codeBlocks.length === 0) {
    return { code: response, language: "tsx", message: "Generated component" };
  }

  return {
    code: codeBlocks[0].code,
    language: codeBlocks[0].language,
    message: `Generated ${input.componentType} component (${input.framework}/${input.cssFramework})`,
  };
}

export const snippetFrontendToolMeta = {
  name: "gemini_snippet_frontend",
  description: `Generate isolated, reusable frontend components.

Use for: modals, cards, forms, tables, navbars, footers, heroes, buttons, etc.
Returns self-contained, importable components with typed props.`,
  inputSchema: snippetFrontendSchema,
};
