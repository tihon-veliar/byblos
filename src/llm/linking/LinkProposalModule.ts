import { Link, Match, Node } from "./../../core/pipeline/contracts";

export function propose(input: { nodes: Node[]; matches: Match[] }): Link[] {
  const { nodes, matches } = input;

  const firstRelatedMatch = matches.find((match) => match.type === "related");
  if (!firstRelatedMatch) {
    return [];
  }

  return nodes.map((node) => ({
    source: node.title,
    target: firstRelatedMatch.title,
    type: "extends",
  }));
}
