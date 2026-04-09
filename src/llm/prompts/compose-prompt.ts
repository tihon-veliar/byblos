import type { PromptSection } from "./types";

export function composePrompt(sections: PromptSection[]): string {
  return sections
    .map(({ title, content }) => `${title}\n\n${content}`.trim())
    .join("\n\n---\n\n")
    .trim();
}
