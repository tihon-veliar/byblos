import type {
  GenerationContext,
  GenerationDraft,
  Link,
  Match,
  Node,
} from "../../core/pipeline/contracts";

import {
  mapNodes,
  extractLinksFromNodes,
} from "../../core/generation/mapper/note-mapper";
import type { PipelineModules } from "../../core/pipeline/pipeline-modules";

import { buildPrompt } from "../../llm/prompts/build-prompt";
import { REFINEMENT_PROMPT_PRESET } from "../../llm/prompts/presets/refinement";
import { generateRawText } from "../../llm/infra/gateway";

import { parseLlmOutput } from "../../core/generation/parser/parse-llm-output";
import { validateParsedLlmOutput } from "../../core/generation/validator/validate-parsed-llm-output";
import {
  llmCallFailed,
  llmParseFailed,
  llmValidationFailed,
} from "../../core/errors/llm-errors";

type RefineInput = {
  draft: GenerationDraft;
  context: GenerationContext;
  matches: Match[];
};

export const RefinementModule: PipelineModules["RefinementModule"] = {
  async refine(input: RefineInput): Promise<{
    nodes: Node[];
    links: Link[];
    rawText: string;
  }> {
    const prompt = buildPrompt({
      preset: REFINEMENT_PROMPT_PRESET,
      context: input.context,
      input: input.draft.content,
    });

    let rawText: string | null = null;
    try {
      rawText = await generateRawText(prompt);
    } catch (error) {
      if (error instanceof Error) {
        throw llmCallFailed("refinement", error);
      } else {
        throw llmCallFailed("refinement", new Error("Unknown error"));
      }
    }

    const parsedResult = parseLlmOutput(rawText);

    if (!parsedResult.ok)
      throw llmParseFailed("refinement", parsedResult.error);

    const validationResult = validateParsedLlmOutput(parsedResult.value);

    if (!validationResult.ok)
      throw llmValidationFailed("refinement", validationResult.error);

    const nodes = mapNodes(parsedResult.value.notes);
    const links = extractLinksFromNodes(nodes);

    return {
      nodes,
      links,
      rawText,
    };
  },
};
