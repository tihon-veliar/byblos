import type { Link, MatchGroups, Node, PipelineResult } from "./contracts";
import type { PipelineModules } from "./pipeline-modules";

type AssembleInput = {
  nodes: Node[];
  matches: MatchGroups;
  links: Link[];
};

// ResultAssembler only packages the final pipeline output.
export const ResultAssembler: PipelineModules["ResultAssembler"] = {
  assemble(input: AssembleInput): PipelineResult {
    const { nodes, matches, links } = input;

    return {
      nodes,
      matches,
      links,
      status: nodes.length > 1 ? "multi" : "seed",
    };
  },
};
