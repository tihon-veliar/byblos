import { describe, expect, it } from "vitest";
import {
  mapNodes,
  extractLinksFromNodes,
  extractTitle,
  extractContent,
  extractWikiLinks,
} from "./note-mapper";

describe("note-mapper", () => {
  it("extractTitle returns h1 title", () => {
    const note = `# Human Agency

Agency is the capacity to act for reasons.`;

    expect(extractTitle(note)).toBe("Human Agency");
  });

  it("extractTitle throws when h1 is missing", () => {
    const note = `## Human Agency

Agency is the capacity to act for reasons.`;

    expect(() => extractTitle(note)).toThrow(
      "note is missing a markdown title",
    );
  });

  it("extractContent returns note body without title", () => {
    const note = `# Human Agency

Agency is the capacity to act for reasons.

It matters for ethics.`;

    expect(extractContent(note)).toBe(
      `Agency is the capacity to act for reasons.

It matters for ethics.`,
    );
  });

  it("extractContent throws when content is empty", () => {
    const note = `# Human Agency`;

    expect(() => extractContent(note)).toThrow("note content cannot be empty");
  });

  it("extractWikiLinks returns all wiki links", () => {
    const content = `Connects to [[Reason]] and [[Responsibility]].`;

    expect(extractWikiLinks(content)).toEqual(["Reason", "Responsibility"]);
  });

  it("extractWikiLinks ignores empty targets after trim filtering", () => {
    const content = `Links: [[Reason]] [[   ]] [[Responsibility]]`;

    expect(extractWikiLinks(content)).toEqual(["Reason", "Responsibility"]);
  });

  it("mapNodes maps parsed notes into nodes", () => {
    const notes = [
      `# Human Agency

Agency is the capacity to act for reasons.`,
      `# Responsibility

Responsibility depends on agency.`,
    ];

    expect(mapNodes(notes)).toEqual([
      {
        id: "refined-node-1",
        title: "Human Agency",
        content: "Agency is the capacity to act for reasons.",
      },
      {
        id: "refined-node-2",
        title: "Responsibility",
        content: "Responsibility depends on agency.",
      },
    ]);
  });

  it("extractLinksFromNodes extracts typed links from node content", () => {
    const nodes = [
      {
        id: "refined-node-1",
        title: "Human Agency",
        content: "Connects to [[Responsibility]] and [[Reason]].",
      },
      {
        id: "refined-node-2",
        title: "Responsibility",
        content: "Depends on [[Human Agency]].",
      },
    ];

    expect(extractLinksFromNodes(nodes)).toEqual([
      {
        source: "Human Agency",
        target: "Responsibility",
        type: "extends",
      },
      {
        source: "Human Agency",
        target: "Reason",
        type: "extends",
      },
      {
        source: "Responsibility",
        target: "Human Agency",
        type: "extends",
      },
    ]);
  });
});
