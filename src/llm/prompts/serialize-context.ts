// src/llm/prompts/serialize-context.ts

import type { GenerationContext } from "../../core/pipeline/contracts";

export function serializeGenerationContext(context: GenerationContext): string {
  const parts: string[] = [];
  if (context.primary) {
    parts.push("PRIMARY:");
    parts.push(formatItem(context.primary));
  }

  if (context.related.length > 0) {
    parts.push("RELATED:");

    for (const item of context.related) {
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
