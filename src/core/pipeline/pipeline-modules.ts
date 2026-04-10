import type {
  Link,
  MatchGroups,
  Match,
  Node,
  PipelineResult,
  GenerationContext,
  Input,
  GenerationDraft,
} from "./contracts";

export type LinkProposalModule = {
  propose(input: { nodes: Node[]; matches: Match[] }): Link[];
};

export type PipelineModules = {
  Normalizer: {
    normalize(text: string): string;
  };

  SearchModule: {
    search(query: string): Match[];
  };

  ContextBuilder: {
    build(matches: Match[]): GenerationContext;
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
      matches: Match[];
    }): Promise<{
      nodes: Node[];
      links: Link[];
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
