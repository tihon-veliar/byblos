import type { Node } from "../pipeline/contracts";
import type { ResolvedTypedLink } from "./resolve-links";

export function buildCanonicalNote(input: {
  node: Node;
  id: string;
  typedLinks: ResolvedTypedLink[];
  createdAt?: string;
  committedAt?: string;
}): string {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const committedAt = input.committedAt ?? createdAt;
  const lines = [
    "---",
    `id: ${input.id}`,
    "type: zettel",
    "epistemicMode: speculative",
    "claimStatus: hypothetical",
    "reviewStatus: committed",
    "aliases: []",
    "tags: []",
    ...formatLinks(input.typedLinks),
    `createdAt: ${createdAt}`,
    `committedAt: ${committedAt}`,
    "---",
    "",
    input.node.rawMarkdown.trim(),
    "",
  ];

  return lines.join("\n");
}

function formatLinks(typedLinks: ResolvedTypedLink[]): string[] {
  if (typedLinks.length === 0) {
    return ["links: []"];
  }

  return [
    "links:",
    ...typedLinks.flatMap((link) => [
      `  - type: ${link.type}`,
      `    targetId: ${link.targetId}`,
    ]),
  ];
}
