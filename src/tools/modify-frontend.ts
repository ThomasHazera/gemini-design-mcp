import { z } from "zod";
import { getGeminiClient } from "../gemini/client.js";
import { buildModifyFrontendPrompt } from "../gemini/prompts.js";
import type { Framework, GeminiModel } from "../types.js";

export const modifyFrontendSchema = z.object({
  filePath: z
    .string()
    .min(1, "File path required")
    .describe("Path to the file to modify"),
  instruction: z
    .string()
    .min(10, "Instruction must be at least 10 characters")
    .describe("What changes to make"),
  framework: z
    .enum(["react", "html", "vue", "svelte"])
    .default("react")
    .describe("Frontend framework of the file"),
  model: z
    .enum(["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-3-flash-preview"])
    .default("gemini-2.5-flash")
    .describe("Gemini model (2.5-flash=standard, 2.5-pro=complex, 3-flash-preview=premium visual)"),
});

export type ModifyFrontendInput = z.infer<typeof modifyFrontendSchema>;

export async function executeModifyFrontend(
  input: ModifyFrontendInput
): Promise<{ code: string; language: string; message: string }> {
  const client = getGeminiClient();

  // Read existing file
  const fs = await import("fs/promises");
  let existingCode: string;
  try {
    existingCode = await fs.readFile(input.filePath, "utf-8");
  } catch (error) {
    throw new Error(`Cannot read file: ${input.filePath}`);
  }

  const prompt = buildModifyFrontendPrompt({
    existingCode,
    instruction: input.instruction,
    framework: input.framework as Framework,
  });

  const response = await client.generateContent(prompt, {
    model: input.model as GeminiModel,
  });

  const codeBlocks = client.extractCode(response);

  if (codeBlocks.length === 0) {
    return { code: response, language: "tsx", message: "Modified code" };
  }

  return {
    code: codeBlocks[0].code,
    language: codeBlocks[0].language,
    message: `Modified ${input.filePath}`,
  };
}

export const modifyFrontendToolMeta = {
  name: "gemini_modify_frontend",
  description: `Modify existing frontend code based on instructions.

Reads the file, applies changes via Gemini, returns the complete modified file.
Use for: adding features, fixing bugs, refactoring, styling changes.`,
  inputSchema: modifyFrontendSchema,
};
