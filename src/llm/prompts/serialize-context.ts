// src/llm/prompts/serialize-context.ts

import type { GenerationContext } from "../../core/pipeline/contracts";

export function serializeGenerationContext(context: GenerationContext): string {
  const parts: string[] = [];
  const supporting = context.supporting ?? [];
  if (context.primary) {
    parts.push("PRIMARY:");
    parts.push(formatItem(context.primary));
  }

  if (supporting.length > 0) {
    parts.push("SUPPORTING:");

    for (const item of supporting) {
      parts.push(formatItem(item));
    }
  }

  return parts.join("\n\n").trim();
}

function formatItem(item: { title: string; content: string }): string {
  const title = item.title.trim();
  const content = item.content.trim();

  return [`# ${title}`, "", content].join("\n");
}
