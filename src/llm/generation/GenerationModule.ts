import type {
  GenerationContext,
  GenerationDraft,
} from "../../core/pipeline/contracts";
import type { PipelineModules } from "../../core/pipeline/pipeline-modules";

import { buildPrompt } from "../../llm/prompts/build-prompt";
import { GENERATION_PROMPT_PRESET } from "../../llm/prompts/presets/generation";
import { generateRawText } from "../../llm/infra/gateway";

import { parseLlmOutput } from "../../core/generation/parser/parse-llm-output";
import { validateParsedLlmOutput } from "../../core/generation/validator/validate-parsed-llm-output";

import {
  llmCallFailed,
  llmParseFailed,
  llmValidationFailed,
} from "../../core/errors/llm-errors";
type GenerateInput = {
  text: string;
  context: GenerationContext;
};

export const GenerationModule: PipelineModules["GenerationModule"] = {
  async generate(input: GenerateInput): Promise<GenerationDraft> {
    const prompt = buildPrompt({
      preset: GENERATION_PROMPT_PRESET,
      context: input.context,
      input: input.text,
    });

    let rawText: string | null = null;
    try {
      rawText = await generateRawText(prompt);
    } catch (error) {
      if (error instanceof Error) {
        throw llmCallFailed("generation", error);
      } else {
        throw llmCallFailed("generation", new Error("Unknown error"));
      }
    }

    const parsedResult = parseLlmOutput(rawText);

    if (!parsedResult.ok)
      throw llmParseFailed("generation", parsedResult.error);

    const validationResult = validateParsedLlmOutput(parsedResult.value, {
      requiredMetaKeys: ["search_phrases"],
    });

    if (!validationResult.ok)
      throw llmValidationFailed("generation", validationResult.error);

    const { notes, meta } = parsedResult.value;

    return {
      content: joinDraftNotes(notes),
      retrievalQueries: readSearchPhrases(meta.search_phrases),
      retrievalSeed: readRetrievalSeed(meta.retrieval_seed, notes),
    };
  },
};

function joinDraftNotes(notes: string[]): string {
  return notes.join("\n\n").trim();
}

function readSearchPhrases(value: string | string[] | undefined): string[] {
  if (!Array.isArray(value)) {
    throw new Error(
      "GenerationModule: search_phrases must be a string array in META.",
    );
  }

  return value.map((item) => item.trim()).filter((item) => item.length > 0);
}

function readRetrievalSeed(
  value: string | string[] | undefined,
  notes: string[],
): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return joinDraftNotes(notes);
}
