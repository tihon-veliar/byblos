import type { Link, Node } from "../../pipeline/contracts";

function mapNodes(notes: string[]): Node[] {
  return notes.map((note, index) => {
    const title = extractTitle(note);
    const content = extractContent(note);

    return {
      // Temporary technical id for pipeline-only transport.
      id: buildNodeId(index),
      title,
      content,
    };
  });
}

function extractLinksFromNodes(nodes: Node[]): Link[] {
  return nodes.flatMap((node) =>
    extractWikiLinks(node.content).map((target) => ({
      source: node.title,
      target,
      type: "extends" as const, // TODO: still temporary until typed-link mapping is defined
    })),
  );
}

function extractTitle(note: string): string {
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

function extractContent(note: string): string {
  const normalized = note.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const titleIndex = lines.findIndex((line) => line.trim().startsWith("# "));

  if (titleIndex === -1) {
    throw new Error("RefinementModule: note is missing a markdown title.");
  }

  const content = lines
    .slice(titleIndex + 1)
    .join("\n")
    .trim();

  if (content.length === 0) {
    throw new Error("RefinementModule: note content cannot be empty.");
  }

  return content;
}

function extractWikiLinks(content: string): string[] {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);

  return Array.from(matches, (match) => match[1].trim()).filter(
    (target) => target.length > 0,
  );
}

function buildNodeId(index: number): string {
  return `refined-node-${index + 1}`;
}

export {
  mapNodes,
  extractLinksFromNodes,
  extractTitle,
  extractContent,
  extractWikiLinks,
  buildNodeId,
};
