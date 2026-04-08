import type { Match, GenerationContext } from "./contracts";
import type { PipelineModules } from "./pipeline-modules";

const MAX_RELATED_MATCHES = 4;

// ContextBuilder only selects a small bounded subset of retrieval results.
export const ContextBuilder: PipelineModules["ContextBuilder"] = {
  build(matches: Match[]): GenerationContext {
    const primary = matches.find((match) => match.type === "strong");
    const related = matches
      .filter((match) => match !== primary)
      .slice(0, MAX_RELATED_MATCHES);

    return {
      primary,
      related,
    };
  },
};
