import type {
  Link,
  MatchGroups,
  NeighborLookup,
  NoteMatch,
  Node,
  PipelineResult,
  GenerationContext,
  GenerationDraft,
  RetrievalResult,
  SearchQuery,
} from "./contracts";
import type { IndexedNote } from "../../indexing/types";

export type LinkProposalModule = {
  propose(input: { nodes: Node[]; matches: NoteMatch[] }): Link[];
};

export type PipelineModules = {
  Normalizer: {
    normalize(text: string): string;
  };

  SearchModule: {
    search(query: SearchQuery): RetrievalResult;
    getNoteById(noteId: string): IndexedNote | undefined;
    getNeighborLookup(noteId: string): NeighborLookup | undefined;
    getSnapshot(): {
      notes: IndexedNote[];
    };
  };

  ContextBuilder: {
    build(input: {
      stage: "generation" | "refinement";
      retrieval: RetrievalResult;
      resolveNote: (noteId: string) => IndexedNote | undefined;
      getNeighborLookup: (noteId: string) => NeighborLookup | undefined;
    }): GenerationContext;
  };

  GenerationModule: {
    generate(input: {
      text: string;
      context: GenerationContext;
    }): Promise<GenerationDraft>;
  };

  RefinementModule: {
    refine(input: {
      draft: GenerationDraft;
      context: GenerationContext;
      matches: NoteMatch[];
    }): Promise<{
      nodes: Node[];
      links: Link[];
      rawText: string;
    }>;
  };

  LinkProposalModule: LinkProposalModule;

  ResultAssembler: {
    assemble(input: {
      nodes: Node[];
      matches: MatchGroups;
      links: Link[];
    }): PipelineResult;
  };
};
