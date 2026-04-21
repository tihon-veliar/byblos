import type { Node } from "../pipeline/contracts";

export function injectOriginLink(node: Node, originTitle: string): Node {
  if (node.wikiLinks.includes(originTitle)) {
    return node;
  }

  const appendedSentence = `\n\nСвязано с [[${originTitle}]].`;
  const titleLine = `# ${node.title}`;
  const body = `${node.content.trim()}${appendedSentence}`;

  return {
    ...node,
    content: body,
    rawMarkdown: `${titleLine}\n\n${body}`,
    wikiLinks: [...node.wikiLinks, originTitle],
  };
}
