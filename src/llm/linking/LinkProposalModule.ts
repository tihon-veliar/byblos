import { Link, NoteMatch, Node } from "./../../core/pipeline/contracts";

export function propose(input: { nodes: Node[]; matches: NoteMatch[] }): Link[] {
  const { nodes, matches } = input;

  const firstRelatedMatch = matches.find((match) => match.bucket === "related");
  if (!firstRelatedMatch) {
    return [];
  }

  return nodes.map((node) => ({
    source: node.title,
    target: firstRelatedMatch.title,
    type: "extends",
  }));
}
