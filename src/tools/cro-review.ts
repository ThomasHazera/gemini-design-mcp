import { z } from "zod";
import { getGeminiClient } from "../gemini/client.js";
import { buildCroReviewPrompt } from "../gemini/prompts.js";
import type { GeminiModel } from "../types.js";

// Output types for CRO review
export interface CROIssue {
  principle: string;
  description: string;
  severity: "critical" | "major" | "minor";
  location: string;
}

export interface CROReviewResult {
  score: number;
  issues: CROIssue[];
  suggestions: string[];
}

export const croReviewSchema = z.object({
  filePath: z
    .string()
    .optional()
    .describe("Path to the file to analyze (provide either filePath or code)"),
  code: z
    .string()
    .optional()
    .describe("Code to analyze directly (provide either filePath or code)"),
  model: z
    .enum(["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-3-flash-preview"])
    .default("gemini-2.5-flash")
    .describe("Gemini model (2.5-flash=standard, 2.5-pro=complex, 3-flash-preview=premium visual)"),
});

export type CROReviewInput = z.infer<typeof croReviewSchema>;

export async function executeCroReview(
  input: CROReviewInput
): Promise<{ result: CROReviewResult; summary: string }> {
  const client = getGeminiClient();

  // Get code to analyze
  let codeToAnalyze: string;
  if (input.code) {
    codeToAnalyze = input.code;
  } else if (input.filePath) {
    const fs = await import("fs/promises");
    try {
      codeToAnalyze = await fs.readFile(input.filePath, "utf-8");
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Cannot read file: ${input.filePath} - ${errMsg}`);
    }
  } else {
    throw new Error("Either filePath or code must be provided");
  }

  const prompt = buildCroReviewPrompt(codeToAnalyze);

  const response = await client.generateContent(prompt, {
    model: input.model as GeminiModel,
    temperature: 0.3, // Lower temperature for more consistent analysis
  });

  // Parse JSON response
  let result: CROReviewResult;
  try {
    // Extract JSON from response (might be wrapped in markdown)
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                      response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    result = JSON.parse(jsonStr) as CROReviewResult;

    // Validate structure
    if (typeof result.score !== "number" || !Array.isArray(result.issues) || !Array.isArray(result.suggestions)) {
      throw new Error("Invalid response structure");
    }
  } catch (parseError) {
    // Fallback: return raw response as suggestion
    return {
      result: {
        score: 50,
        issues: [],
        suggestions: [response],
      },
      summary: "Could not parse structured response. Raw analysis provided in suggestions.",
    };
  }

  // Build summary
  const criticalCount = result.issues.filter(i => i.severity === "critical").length;
  const majorCount = result.issues.filter(i => i.severity === "major").length;
  const minorCount = result.issues.filter(i => i.severity === "minor").length;

  let summary = `CRO Score: ${result.score}/100\n`;
  summary += `Issues: ${criticalCount} critical, ${majorCount} major, ${minorCount} minor\n`;

  if (result.score >= 80) {
    summary += "✅ Good CRO compliance";
  } else if (result.score >= 60) {
    summary += "⚠️ Needs improvement";
  } else {
    summary += "❌ Poor CRO compliance - significant changes recommended";
  }

  return { result, summary };
}

export const croReviewToolMeta = {
  name: "gemini_cro_review",
  description: `Analyze frontend code for CRO (Conversion Rate Optimization) issues.

Evaluates code against these principles:
- Time-to-Value: friction in user journey
- Action > Explanation: too much text, not enough interaction
- Progress Visibility: missing progress indicators
- Empty States: blank screens without guidance
- Guided Tours: overwhelming onboarding
- Activation Focus: unclear primary actions

Returns:
- Score (0-100)
- Issues with severity (critical/major/minor)
- Actionable suggestions`,
  inputSchema: croReviewSchema,
};
