import { z } from "zod";
import { getGeminiClient } from "../gemini/client.js";
import { CRO_PRINCIPLES } from "../gemini/prompts.js";
import type { GeminiModel } from "../types.js";

export const designSystemSchema = z.object({
  projectDescription: z
    .string()
    .min(10, "Project description required")
    .describe("Description of the project (purpose, audience, industry)"),
  style: z
    .string()
    .optional()
    .describe("Aesthetic direction: minimal, corporate, playful, luxury, tech, etc."),
  existingCssPath: z
    .string()
    .optional()
    .describe("Path to existing CSS/theme file to analyze"),
  framework: z
    .enum(["react", "html", "vue", "svelte"])
    .default("react")
    .describe("Target framework"),
  cssFramework: z
    .enum(["tailwind", "css", "shadcn"])
    .default("tailwind")
    .describe("CSS approach"),
  model: z
    .enum(["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash-lite"])
    .default("gemini-2.5-pro") // Pro for better quality design systems
    .describe("Gemini model (pro recommended for design systems)"),
  includeCroPrinciples: z
    .boolean()
    .default(true)
    .describe("Include CRO guidelines in design system"),
});

export type DesignSystemInput = z.infer<typeof designSystemSchema>;

function buildDesignSystemPrompt(input: DesignSystemInput, existingCss?: string): string {
  let prompt = `You are a senior UI/UX designer creating a comprehensive design system.

## Project Context
${input.projectDescription}

## Style Direction
${input.style || "Modern, clean, professional"}

## Target Stack
- Framework: ${input.framework}
- CSS: ${input.cssFramework}
`;

  if (existingCss) {
    prompt += `
## Existing CSS/Theme to Build Upon
\`\`\`css
${existingCss}
\`\`\`
`;
  }

  if (input.includeCroPrinciples) {
    prompt += `
## CRO Principles to Include
The design system should incorporate conversion-focused patterns:
${CRO_PRINCIPLES}
`;
  }

  prompt += `
## Output Format
Generate a complete design-system.md file in Markdown with these sections:

# Design System: [Project Name]

## 1. Brand & Visual Identity
- Primary and secondary colors (with hex codes)
- Color palette with semantic names (success, warning, error, info)
- Color contrast notes for accessibility

## 2. Typography
- Font families (headings, body, monospace)
- Font sizes scale (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)
- Line heights and letter spacing
- Font weights used

## 3. Spacing System
- Spacing scale (0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, etc.)
- When to use each spacing value
- Container max-widths

## 4. Components Library
For each core component, provide:
- Visual description
- States (default, hover, active, disabled, focus)
- Variants (size, color)
- ${input.cssFramework === "tailwind" ? "Tailwind classes" : "CSS classes"}

Core components to define:
- Buttons (primary, secondary, ghost, danger)
- Inputs (text, textarea, select, checkbox, radio)
- Cards
- Modals/Dialogs
- Navigation (navbar, sidebar, breadcrumbs)
- Tables
- Badges/Tags
- Alerts/Toasts
- Loading states (spinners, skeletons)

## 5. Layout Patterns
- Grid system
- Responsive breakpoints
- Common page layouts

## 6. Iconography
- Icon style (outline, solid, duotone)
- Icon sizes
- Recommended icon library

## 7. Motion & Animation
- Transition durations (fast, normal, slow)
- Easing functions
- Common animations (fade, slide, scale)

## 8. Dark Mode (if applicable)
- Color adjustments
- Component variants

${input.includeCroPrinciples ? `
## 9. CRO Patterns
- Empty state templates
- Progress indicators
- Success/celebration states
- Primary CTA styling
- Onboarding component patterns
` : ""}

## 10. Code Examples
Provide ${input.framework} code snippets for key components.

---
Return ONLY the markdown content, ready to save as design-system.md.
`;

  return prompt;
}

export async function executeDesignSystem(
  input: DesignSystemInput
): Promise<{ content: string; message: string }> {
  const client = getGeminiClient();

  // Load existing CSS if provided
  let existingCss: string | undefined;
  if (input.existingCssPath) {
    try {
      const fs = await import("fs/promises");
      existingCss = await fs.readFile(input.existingCssPath, "utf-8");
    } catch {
      console.error(`Warning: Could not load CSS from ${input.existingCssPath}`);
    }
  }

  const prompt = buildDesignSystemPrompt(input, existingCss);

  const response = await client.generateContent(prompt, {
    model: input.model as GeminiModel,
    temperature: 0.7,
    maxOutputTokens: 16384, // Large output for comprehensive design system
  });

  // Clean up response - remove markdown code blocks if present
  let content = response;
  const mdMatch = response.match(/```markdown\n?([\s\S]*?)\n?```/);
  if (mdMatch) {
    content = mdMatch[1];
  }

  return {
    content,
    message: `Generated design system for ${input.framework}/${input.cssFramework}${input.includeCroPrinciples ? " with CRO patterns" : ""}`,
  };
}

export const designSystemToolMeta = {
  name: "gemini_design_system",
  description: `Generate a comprehensive design-system.md file for your project.

Creates a complete design system including:
- Colors, typography, spacing
- Component specifications (buttons, inputs, cards, modals, etc.)
- Layout patterns and breakpoints
- Motion/animation guidelines
- CRO-optimized patterns (empty states, progress, CTAs)

Use gemini-2.5-pro for best quality (default).
Save the output as design-system.md and reference it in other tools.`,
  inputSchema: designSystemSchema,
};
