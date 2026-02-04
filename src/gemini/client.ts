import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { GeminiModel, GeminiConfig } from "../types.js";

export class GeminiClient {
  private client: GoogleGenerativeAI;
  private defaultModel: GeminiModel;

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new Error("GEMINI_API_KEY is required. Set it in your .env file.");
    }
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.defaultModel = config.defaultModel || "gemini-2.5-flash";
  }

  private getModel(modelName?: GeminiModel): GenerativeModel {
    const model = modelName || this.defaultModel;
    return this.client.getGenerativeModel({ model });
  }

  async generateContent(
    prompt: string,
    options?: {
      model?: GeminiModel;
      temperature?: number;
      maxOutputTokens?: number;
    }
  ): Promise<string> {
    const model = this.getModel(options?.model);

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxOutputTokens ?? 8192,
        },
      });

      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      return text;
    } catch (error) {
      if (error instanceof Error) {
        // Handle specific API errors
        if (error.message.includes("API_KEY")) {
          throw new Error("Invalid GEMINI_API_KEY. Please check your API key.");
        }
        if (error.message.includes("RATE_LIMIT") || error.message.includes("429")) {
          throw new Error("Gemini API rate limit exceeded. Please wait and retry.");
        }
        if (error.message.includes("timeout") || error.message.includes("DEADLINE")) {
          throw new Error("Gemini API timeout. Try a smaller request or retry.");
        }
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Extract code blocks from Gemini response
   */
  extractCode(response: string): { code: string; language: string }[] {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const matches: { code: string; language: string }[] = [];

    let match;
    while ((match = codeBlockRegex.exec(response)) !== null) {
      matches.push({
        language: match[1] || "plaintext",
        code: match[2].trim(),
      });
    }

    return matches;
  }
}

// Singleton factory
let clientInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!clientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    clientInstance = new GeminiClient({
      apiKey,
      defaultModel: "gemini-2.5-flash",
    });
  }
  return clientInstance;
}
