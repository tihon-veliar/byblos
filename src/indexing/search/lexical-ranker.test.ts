import { describe, expect, it } from "vitest";
import { rankLexicalMatches } from "./lexical-ranker";
import type { NoteIndexSnapshot } from "../types";

describe("rankLexicalMatches", () => {
  it("returns deterministic strong and related buckets", () => {
    const snapshot: NoteIndexSnapshot = {
      notes: [
        {
          id: "n1",
          path: "Byblos/notes/human-agency.md",
          title: "Human Agency",
          normalizedTitle: "human agency",
          aliases: ["Agency"],
          tags: ["ethics"],
          type: "zettel",
          epistemicMode: "speculative",
          claimStatus: "hypothetical",
          reviewStatus: "committed",
          content: "Agency connects to responsibility.",
          rawMarkdown: "# Human Agency\n\nAgency connects to responsibility.",
          titleTokens: ["human", "agency"],
          contentTokens: ["agency", "connects", "responsibility"],
          aliasTokens: ["agency"],
          tagTokens: ["ethics"],
          outgoingWikiLinks: ["Responsibility"],
          outgoingTypedLinks: [],
        },
        {
          id: "n2",
          path: "Byblos/notes/responsibility.md",
          title: "Responsibility",
          normalizedTitle: "responsibility",
          aliases: [],
          tags: [],
          content: "Responsibility depends on agency.",
          rawMarkdown: "# Responsibility\n\nResponsibility depends on agency.",
          titleTokens: ["responsibility"],
          contentTokens: ["responsibility", "depends", "agency"],
          aliasTokens: [],
          tagTokens: [],
          outgoingWikiLinks: ["Human Agency"],
          outgoingTypedLinks: [],
        },
      ],
      graph: {
        outgoingById: {},
        incomingById: {},
      },
      buildMeta: {
        version: 1,
        builtAt: "2026-04-20T00:00:00.000Z",
        noteCount: 2,
      },
      titleLookup: {
        byNormalizedTitle: {
          "human agency": "n1",
          responsibility: "n2",
        },
        byAlias: {},
      },
    };

    const result = rankLexicalMatches(
      {
        text: "human agency responsibility",
        stage: "search-1",
        limit: 5,
      },
      snapshot,
    );

    expect(result.strong.map((match) => match.noteId)).toEqual(["n1"]);
    expect(result.related.map((match) => match.noteId)).toEqual(["n2"]);
    expect(result.strong[0]?.reason).toContain("title overlap");
  });
});
