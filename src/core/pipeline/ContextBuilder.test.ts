import { describe, expect, it } from "vitest";

import type { IndexedNote } from "../../indexing/types";
import { ContextBuilder } from "./ContextBuilder";
import type { RetrievalResult } from "./contracts";

const NOTES: IndexedNote[] = [
  makeNote("m-1", "Primary Match"),
  makeNote("m-2", "Related One"),
  makeNote("m-3", "Related Two"),
  makeNote("m-4", "Related Three"),
  makeNote("m-5", "Related Four"),
  makeNote("m-6", "Related Five"),
  makeNote("m-7", "Neighbor Note"),
];

describe("ContextBuilder", () => {
  it("selects a strong match as primary and fills supporting notes from retrieval", () => {
    const retrieval: RetrievalResult = {
      query: { text: "primary", stage: "search-1", limit: 5 },
      strong: [
        match("m-1", "Primary Match", "strong", "exact title match", 100),
      ],
      related: [
        match("m-2", "Related One", "related", "content overlap", 18),
        match("m-3", "Related Two", "related", "content overlap", 16),
      ],
    };

    const context = ContextBuilder.build({
      stage: "generation",
      retrieval,
      resolveNote: resolveNote,
      getNeighborLookup: () => undefined,
    });

    expect(context.primary).toMatchObject({
      noteId: "m-1",
      title: "Primary Match",
      role: "primary",
    });
    expect(context.supporting.map((item) => item.noteId)).toEqual([
      "m-2",
      "m-3",
    ]);
    expect(context.trace).not.toHaveLength(0);
  });

  it("caps supporting notes and can include one direct neighbor during refinement", () => {
    const retrieval: RetrievalResult = {
      query: { text: "primary", stage: "search-2", limit: 6 },
      strong: [
        match("m-1", "Primary Match", "strong", "exact title match", 100),
        match("m-2", "Strong Support", "strong", "title overlap", 48),
        match("m-3", "Primary Match", "strong", "duplicate", 45),
      ],
      related: [
        match("m-4", "Related Three", "related", "content overlap", 14),
        match("m-5", "Related Four", "related", "content overlap", 13),
        match("m-6", "Related Five", "related", "content overlap", 12),
      ],
    };

    const context = ContextBuilder.build({
      stage: "refinement",
      retrieval,
      resolveNote: resolveNote,
      getNeighborLookup: (noteId) =>
        noteId === "m-1"
          ? {
              noteId,
              outgoing: ["m-7"],
              incoming: [],
            }
          : undefined,
    });

    expect(context.primary?.noteId).toBe("m-1");
    expect(context.supporting).toHaveLength(4);
    expect(context.supporting.map((item) => item.noteId)).toEqual([
      "m-2",
      "m-4",
      "m-5",
      "m-7",
    ]);
    expect(context.omitted).toContainEqual({
      noteId: "m-3",
      reason: "near-duplicate title of primary",
    });
  });

  it("returns a valid minimal context for empty retrieval", () => {
    const context = ContextBuilder.build({
      stage: "generation",
      retrieval: {
        query: { text: "none", stage: "search-1", limit: 5 },
        strong: [],
        related: [],
      },
      resolveNote: resolveNote,
      getNeighborLookup: () => undefined,
    });

    expect(context).toEqual({
      stage: "generation",
      primary: undefined,
      supporting: [],
      omitted: [],
      trace: ["No strong match selected as primary."],
    });
  });
});

function resolveNote(noteId: string): IndexedNote | undefined {
  return NOTES.find((note) => note.id === noteId);
}

function makeNote(id: string, title: string): IndexedNote {
  return {
    id,
    path: `Byblos/notes/${id}.md`,
    title,
    normalizedTitle: title.toLowerCase(),
    aliases: [],
    tags: [],
    content: `${title} content`,
    rawMarkdown: `# ${title}\n\n${title} content`,
    titleTokens: title.toLowerCase().split(" "),
    contentTokens: [title.toLowerCase(), "content"],
    aliasTokens: [],
    tagTokens: [],
    outgoingWikiLinks: [],
    outgoingTypedLinks: [],
  };
}

function match(
  noteId: string,
  title: string,
  bucket: "strong" | "related",
  reason: string,
  score: number,
) {
  return {
    noteId,
    title,
    path: `Byblos/notes/${noteId}.md`,
    bucket,
    score,
    signals: [],
    reason,
  };
}
