import type {
  Input,
  NoteMatch,
  RetrievalResult,
  SearchQuery,
  PipelineResult,
} from "./contracts";
import type { PipelineModules } from "./pipeline-modules";

export class PipelineOrchestrator {
  constructor(
    private readonly modules: PipelineModules,
    private readonly logger: Pick<Console, "log"> = console,
  ) {}

  async run(input: Input): Promise<PipelineResult> {
    const normalizedText = this.modules.Normalizer.normalize(input.text);
    this.log("Normalize", `text=${normalizedText}`);

    const initialQuery: SearchQuery = {
      text: normalizedText,
      stage: "search-1",
      limit: 5,
    };
    const initialMatches = this.modules.SearchModule.search(initialQuery);
    this.log(
      "Search-1",
      `strong=${initialMatches.strong.length} related=${initialMatches.related.length}`,
    );

    const context1 = this.modules.ContextBuilder.build({
      stage: "generation",
      retrieval: initialMatches,
      resolveNote: (noteId) => this.modules.SearchModule.getNoteById(noteId),
      getNeighborLookup: (noteId) =>
        this.modules.SearchModule.getNeighborLookup(noteId),
    });
    this.log(
      "Context-1",
      `primary=${context1.primary?.title ?? "none"} supporting=${context1.supporting.length}`,
    );

    const draft = await this.modules.GenerationModule.generate({
      text: normalizedText,
      context: context1,
    });
    this.log("Generate-Draft", `draft.content=${draft.content}`);

    const generatedQuery: SearchQuery = {
      text: [draft.retrievalSeed, ...draft.retrievalQueries].join(" ").trim(),
      stage: "search-2",
      limit: 6,
    };
    const generatedMatches = this.modules.SearchModule.search(generatedQuery);
    this.log(
      "Search-2",
      `strong=${generatedMatches.strong.length} related=${generatedMatches.related.length}`,
    );

    const mergedMatches = mergeRetrievalResults(initialMatches, generatedMatches);
    const context2 = this.modules.ContextBuilder.build({
      stage: "refinement",
      retrieval: mergedMatches,
      resolveNote: (noteId) => this.modules.SearchModule.getNoteById(noteId),
      getNeighborLookup: (noteId) =>
        this.modules.SearchModule.getNeighborLookup(noteId),
    });
    this.log(
      "Context-2",
      `primary=${context2.primary?.title ?? "none"} supporting=${context2.supporting.length}`,
    );

    const refined = await this.modules.RefinementModule.refine({
      draft,
      context: context2,
      matches: [...mergedMatches.strong, ...mergedMatches.related],
    });
    this.log(
      "Refine",
      `nodes=${refined.nodes.length} links=${refined.links.length}`,
    );

    const result = this.modules.ResultAssembler.assemble({
      nodes: refined.nodes,
      matches: {
        initial: initialMatches,
        generated: generatedMatches,
      },
      links: refined.links,
    });

    this.log(
      "Assemble",
      `status=${result.status} nodes=${result.nodes.length} links=${result.links.length}`,
    );

    return result;
  }

  private log(stepName: string, summary: string): void {
    this.logger.log(`[${stepName}] ${summary}`);
  }
}

function mergeRetrievalResults(
  left: RetrievalResult,
  right: RetrievalResult,
): RetrievalResult {
  return {
    query: right.query,
    strong: dedupeMatches([...left.strong, ...right.strong]),
    related: dedupeMatches([...left.related, ...right.related]).filter(
      (match) =>
        ![...left.strong, ...right.strong].some(
          (strongMatch) => strongMatch.noteId === match.noteId,
        ),
    ),
  };
}

function dedupeMatches(matches: NoteMatch[]): NoteMatch[] {
  const byId = new Map<string, NoteMatch>();

  for (const match of matches) {
    const current = byId.get(match.noteId);

    if (!current || current.score < match.score) {
      byId.set(match.noteId, match);
    }
  }

  return Array.from(byId.values()).sort(
    (left, right) =>
      right.score - left.score ||
      left.title.localeCompare(right.title) ||
      left.noteId.localeCompare(right.noteId),
  );
}
