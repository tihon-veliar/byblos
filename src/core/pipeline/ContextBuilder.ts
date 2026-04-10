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

    console.log(matches);

    const _primary = primary
      ? {
          id: primary.id,
          title: primary.title,
          content: `# ${primary?.title}
        Primary Node [Link] Test
        `, // TODO: get content from notes by Match.id
        }
      : undefined;

    return {
      primary: _primary,
      related: related.map((m) => ({
        id: m.id,
        title: m.title,
        content: `# ${m.title}
        Related Node [Link] Test
        `, // TODO: get content from notes by Match.id
      })),
    };
  },
};

const context = ContextBuilder.build([
  { id: "m-1", title: "Primary Match", score: 0.95, type: "strong" },
  { id: "m-2", title: "Related One", score: 0.7, type: "related" },
  { id: "m-3", title: "Related Two", score: 0.68, type: "related" },
  { id: "m-4", title: "Related Three", score: 0.65, type: "related" },
  { id: "m-5", title: "Related Four", score: 0.63, type: "related" },
  { id: "m-6", title: "Related Five", score: 0.61, type: "related" },
]);

console.log(JSON.stringify(context, null, 2));
