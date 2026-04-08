import type {
  GenerationContext,
  GenerationDraft,
} from "../../core/pipeline/contracts";
import type { PipelineModules } from "../../core/pipeline/pipeline-modules";

type GenerateInput = {
  text: string;
  context: GenerationContext;
};

export const GenerationModule: PipelineModules["GenerationModule"] = {
  generate(input: GenerateInput): GenerationDraft {
    const normalizedText = normalizeText(input.text);
    const primaryTitle = normalizeText(input.context.primary?.title);

    return {
      content: buildDraftContent(normalizedText, primaryTitle),
      retrievalQueries: buildRetrievalQueries(normalizedText, primaryTitle),
      retrievalSeed: buildRetrievalSeed(normalizedText, primaryTitle),
    };
  },
};

function buildDraftContent(
  text: string,
  primaryTitle: string | undefined,
): string {
  const parts = [`Draft note: ${text}.`]; // TODO: Wrong format

  if (primaryTitle) {
    parts.push(`Context anchor: ${primaryTitle}.`);
    parts.push(`Working direction: connect the input to ${primaryTitle}.`);
  } else {
    parts.push("Working direction: clarify the main idea before refinement.");
  }

  return parts.join(" ");
}

function buildRetrievalQueries(
  text: string,
  primaryTitle: string | undefined,
): string[] {
  const queries = [text];

  if (primaryTitle) {
    queries.push(primaryTitle);
  }

  return dedupeQueries(queries).slice(0, 2);
}

function buildRetrievalSeed(
  text: string,
  primaryTitle: string | undefined,
): string {
  if (primaryTitle && primaryTitle.length <= text.length) {
    return primaryTitle;
  }

  return text;
}

function dedupeQueries(values: string[]): string[] {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalizedValue = value.toLowerCase();

    if (seen.has(normalizedValue)) {
      return false;
    }

    seen.add(normalizedValue);
    return true;
  });
}

function normalizeText(value: string | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}
