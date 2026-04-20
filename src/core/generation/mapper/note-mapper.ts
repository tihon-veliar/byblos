import type { Link, Node } from "../../pipeline/contracts";

export function mapNodes(notes: string[]): Node[] {
  return notes.map((note, index) => {
    const normalized = note.replace(/\r\n/g, "\n").trim();
    const title = extractTitle(normalized);
    const content = extractContent(normalized);

    return {
      id: buildNodeId(index),
      title,
      content,
      rawMarkdown: normalized,
      wikiLinks: extractWikiLinks(content),
    };
  });
}

export function extractLinksFromNodes(nodes: Node[]): Link[] {
  return nodes.flatMap((node) =>
    (node.wikiLinks ?? extractWikiLinks(node.content)).map((target) => ({
      source: node.title,
      target,
      type: "extends" as const,
    })),
  );
}

export function extractTitle(note: string): string {
  const normalized = note.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const titleLine = lines.find((line) => line.trim().startsWith("# "));

  if (!titleLine) {
    throw new Error("RefinementModule: note is missing a markdown title.");
  }

  const title = titleLine.trim().slice(2).trim();

  if (title.length === 0) {
    throw new Error("RefinementModule: note title cannot be empty.");
  }

  return title;
}

export function extractContent(note: string): string {
  const normalized = note.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const titleIndex = lines.findIndex((line) => line.trim().startsWith("# "));

  if (titleIndex === -1) {
    throw new Error("RefinementModule: note is missing a markdown title.");
  }

  const content = lines.slice(titleIndex + 1).join("\n").trim();

  if (content.length === 0) {
    throw new Error("RefinementModule: note content cannot be empty.");
  }

  return content;
}

export function extractWikiLinks(content: string): string[] {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);

  return Array.from(matches, (match) => match[1].trim()).filter(
    (target) => target.length > 0,
  );
}

export function buildNodeId(index: number): string {
  return `refined-node-${index + 1}`;
}
