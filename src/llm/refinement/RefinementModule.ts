import type {
  GenerationContext,
  GenerationDraft,
  Link,
  Match,
  Node,
} from "../../core/pipeline/contracts";
import type { PipelineModules } from "../../core/pipeline/pipeline-modules";

type RefineInput = {
  draft: GenerationDraft;
  context: GenerationContext;
  matches: Match[];
};

type ParsedBlock = {
  title: string;
  content: string;
  links: Array<{
    type: Link["type"];
    targetTitle: string;
  }>;
};

const NOTE_SEPARATOR = "---NOTE---";

export const RefinementModule: PipelineModules["RefinementModule"] = {
  refine(input: RefineInput): {
    nodes: Node[];
    links: Link[];
    rawText: string;
  } {
    const rawText = buildStubResponse(input);
    const blocks = parseBlocks(rawText);
    const nodes = blocks.map((block, index) => ({
      // Temporary technical id for the pipeline skeleton; Byblos linking is title-based.
      id: buildNodeId(index),
      title: block.title,
      content: block.content,
    }));
    const links = extractLinks(blocks, nodes);

    return {
      nodes,
      links,
      rawText,
    };
  },
};

function buildStubResponse(input: RefineInput): string {
  const seedText = input.draft.retrievalSeed.trim();
  const draftText = input.draft.content.trim();
  const primaryTitle = input.context.primary?.title?.trim();

  if (input.draft.retrievalQueries.length > 0) {
    const firstTitle = buildTitle(seedText, "Idea A");
    const secondTitle = buildTitle(input.draft.retrievalQueries[0], "Idea B");
    const firstContent = buildContent(seedText, draftText, primaryTitle);
    const secondContent = buildContent(
      input.draft.retrievalQueries[0],
      draftText,
      primaryTitle,
    );

    return [
      `# ${firstTitle}`,
      "",
      firstContent,
      "",
      NOTE_SEPARATOR,
      "",
      `# ${secondTitle}`,
      "",
      `${secondContent}\n\nThis idea extends [[${firstTitle}]].`,
    ].join("\n");
  }

  return [
    `# ${buildTitle(seedText, "Refined Idea")}`,
    "",
    buildContent(seedText, draftText, primaryTitle),
  ].join("\n");
}

function parseBlocks(rawText: string): ParsedBlock[] {
  const segments = rawText
    .split(NOTE_SEPARATOR)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    throw new Error(
      "RefinementModule: stub output did not contain note blocks.",
    );
  }

  return segments.map(parseBlock);
}

function parseBlock(blockText: string): ParsedBlock {
  const normalizedBlock = blockText.replace(/\r\n/g, "\n");
  const lines = normalizedBlock.split("\n");
  const titleLine = lines.find((line) => line.trim().startsWith("# "));

  if (!titleLine) {
    throw new Error(
      "RefinementModule: note block is missing a markdown title.",
    );
  }

  const title = titleLine.trim().slice(2).trim();

  if (title.length === 0) {
    throw new Error("RefinementModule: note title cannot be empty.");
  }

  const titleIndex = normalizedBlock.indexOf(titleLine);
  const contentStart = titleIndex + titleLine.length;
  const content = normalizedBlock.slice(contentStart).replace(/^\n+/, "");

  if (content.trim().length === 0) {
    throw new Error("RefinementModule: note block is missing content.");
  }

  return {
    title,
    content,
    links: extractWikiLinks(content),
  };
}

function extractLinks(blocks: ParsedBlock[], nodes: Node[]): Link[] {
  return blocks.flatMap((block, index) =>
    block.links.map((link) => ({
      source: nodes[index].title, // TODO:  Refine to support title-based linking.
      target: link.targetTitle,
      type: link.type,
    })),
  );
}

function extractWikiLinks(content: string): ParsedBlock["links"] {
  const matches = content.matchAll(/\[\[([^\]]+)\]\]/g);

  return Array.from(matches, (match) => {
    const targetTitle = match[1].trim();

    if (targetTitle.length === 0) {
      throw new Error("RefinementModule: wikilink target cannot be empty.");
    }

    return {
      type: "extends" as const, // TODO: temporary
      targetTitle,
    };
  });
}

function buildNodeId(index: number): string {
  return `refined-node-${index + 1}`;
}

function buildTitle(source: string, fallback: string): string {
  const cleaned = source.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : fallback;
}

function buildContent(
  seedText: string,
  draftText: string,
  primaryTitle: string | undefined,
): string {
  const parts = [draftText, seedText]
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (primaryTitle) {
    parts.push(`Context anchor: ${primaryTitle}.`);
  }

  const content = parts.join(" ").trim();

  if (content.length === 0) {
    throw new Error("RefinementModule: stub could not build note content.");
  }

  return content;
}
