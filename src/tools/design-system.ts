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
    .enum(["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-3-flash-preview"])
    .default("gemini-2.5-pro") // Pro for better quality design systems
    .describe("Gemini model (pro recommended for design systems, 3-flash-preview=premium visual)"),
  includeCroPrinciples: z
    .boolean()
    .default(true)
    .describe("Include CRO guidelines in design system"),
  output: z
    .enum(["design-md", "legacy"])
    .default("design-md")
    .describe("Output format: 'design-md' for Google Labs DESIGN.md spec (default), 'legacy' for the original 10-section custom format"),
});

export type DesignSystemInput = z.infer<typeof designSystemSchema>;

function buildDesignMdPrompt(input: DesignSystemInput, existingCss?: string): string {
  let prompt = `You are a senior UI/UX designer creating a DESIGN.md file following the Google Labs open-source specification (https://github.com/google-labs-code/design.md).

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
## CRO Principles
These conversion-rate-optimization principles must be embedded directly in the "Do's and Don'ts" section of the output — do NOT create a separate CRO section:
${CRO_PRINCIPLES}
`;
  }

  prompt += `
## Output Format: Google Labs DESIGN.md Specification

Generate a complete DESIGN.md file with the following structure:

### Part 1 — YAML Frontmatter (between --- fences)

Required fields:
- \`name\`: project/design system name
- \`version: alpha\`
- \`description\`: one-sentence project description (optional but recommended)
- \`colors\`: map of token names to sRGB hex values ("#RRGGBB"). Include: primary, accent, background, surface, text, text-muted, border, success, warning, error
- \`typography\`: map of token names to objects with fontFamily, fontSize, fontWeight, lineHeight, and optionally letterSpacing. Include at minimum: heading-1, heading-2, body, body-sm, label, caption
- \`rounded\`: map using canonical scale names (none, sm, md, lg, xl, full) to pixel values ("Npx")
- \`spacing\`: map using canonical scale names (xs, sm, md, lg, xl, 2xl, 3xl) to pixel values ("Npx")
- \`components\`: map of component names to objects. Each component property MUST use token references in the form "{colors.token}", "{typography.token}", "{rounded.token}", "{spacing.token}" — NEVER use raw hex or pixel values. Required properties per component: backgroundColor, textColor, typography, rounded, padding

### Part 2 — Markdown Body (8 canonical sections, in this exact order)

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts

Rules:
- Use ONLY these 8 section headings, in this exact order
- Do NOT add any extra sections (no "## 9. CRO Patterns", no "## Code Examples", etc.)
- In "## Components", add a ### subsection for each component defined in the frontmatter
- In "## Do's and Don'ts", use ✅ **Do** and ❌ **Don't** lines${input.includeCroPrinciples ? "; embed the CRO principles from above as concrete Do/Don't rules — do NOT create a separate CRO section" : ""}
- All component property values in the YAML frontmatter must be token references, never raw values

### Critical constraints
- Output MUST start with \`---\` on line 1 (start of YAML frontmatter)
- Color values must be valid sRGB hex (#RRGGBB)
- Typography objects must include fontFamily, fontSize, fontWeight, lineHeight
- Use canonical scale names: xs, sm, md, lg, xl, 2xl, 3xl for spacing; none, sm, md, lg, xl, full for rounded
- Return ONLY the markdown content — no preamble, no explanation, no surrounding code fences
`;

  return prompt;
}

function buildLegacyPrompt(input: DesignSystemInput, existingCss?: string): string {
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

  const prompt = input.output === "design-md"
    ? buildDesignMdPrompt(input, existingCss)
    : buildLegacyPrompt(input, existingCss);

  const response = await client.generateContent(prompt, {
    model: input.model as GeminiModel,
    temperature: 0.7,
    maxOutputTokens: 16384, // Large output for comprehensive design system
  });

  // Clean up response
  let content = response;
  if (input.output === "design-md") {
    // For design-md: strip surrounding ```markdown fences if present; content must start with ---
    const mdMatch = response.match(/```markdown\n?([\s\S]*?)\n?```/);
    if (mdMatch) {
      content = mdMatch[1];
    }
    // Trim leading whitespace/newlines so the file starts cleanly with ---
    content = content.trimStart();
  } else {
    // Legacy: original behaviour — strip markdown code blocks if present
    const mdMatch = response.match(/```markdown\n?([\s\S]*?)\n?```/);
    if (mdMatch) {
      content = mdMatch[1];
    }
  }

  return {
    content,
    message: `Generated ${input.output === "design-md" ? "DESIGN.md (Google Labs spec)" : "design system (legacy format)"} for ${input.framework}/${input.cssFramework}${input.includeCroPrinciples ? " with CRO patterns" : ""}`,
  };
}

export const designSystemToolMeta = {
  name: "gemini_design_system",
  description: `Generates a DESIGN.md file compliant with the Google Labs open-source spec (default). Falls back to a legacy 10-section format via \`output: 'legacy'\` for backwards compatibility.

Creates a complete design system including:
- YAML frontmatter with color, typography, spacing, rounded, and component tokens
- 8 canonical sections: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts
- All component values use token references (e.g. "{colors.primary}")
- CRO-optimized patterns embedded in Do's and Don'ts (when includeCroPrinciples is true)

Use gemini-2.5-pro for best quality (default).
Save the output as DESIGN.md and reference it in other tools.`,
  inputSchema: designSystemSchema,
};
