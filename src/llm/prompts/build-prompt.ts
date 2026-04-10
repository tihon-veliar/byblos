import { composePrompt } from "./compose-prompt";
import type { BuildPromptInput } from "./types";

import { ROLE } from "./blocks/role";
import { OUTPUT_FORMAT } from "./blocks/output-format";
import { META_FORMAT } from "./blocks/meta-format";
import { NOTE_RULES } from "./blocks/note-rules";
import { serializeGenerationContext } from "./serialize-context";

export function buildPrompt(input: BuildPromptInput): string {
  return composePrompt([
    {
      title: "ROLE",
      content: ROLE,
    },
    {
      title: "OUTPUT FORMAT",
      content: OUTPUT_FORMAT,
    },
    {
      title: "META FORMAT",
      content: META_FORMAT,
    },
    {
      title: "NOTE RULES",
      content: NOTE_RULES,
    },
    {
      title: "TASK",
      content: input.preset.task,
    },
    {
      title: "META SPEC",
      content: input.preset.metaSpec,
    },
    {
      title: "CONTEXT",
      content: serializeGenerationContext(input.context),
    },
    {
      title: "INPUT",
      content: input.input,
    },
  ]);
}
