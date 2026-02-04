export interface GeminiConfig {
  apiKey: string;
  defaultModel: GeminiModel;
}

export type GeminiModel =
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.0-flash-lite";

export type Framework = "react" | "html" | "vue" | "svelte";
export type CssFramework = "tailwind" | "css" | "shadcn";

export interface CreateFrontendInput {
  description: string;
  framework?: Framework;
  cssFramework?: CssFramework;
  designSystemPath?: string;
  model?: GeminiModel;
  responsive?: boolean;
  accessibility?: boolean;
  applyCroPrinciples?: boolean;
}

export interface GeneratedCode {
  code: string;
  language: string;
  filename?: string;
}
