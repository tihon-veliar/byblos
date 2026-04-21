import { describe, expect, it, vi } from "vitest";
import { commitNotes } from "./commit-notes";
import type { Node } from "../pipeline/contracts";
import type { IndexedNote } from "../../indexing/types";

describe("commitNotes", () => {
  it("writes canonical notes with resolved typed links", async () => {
    const writes: Array<{ path: string; content: string }> = [];
    const nodes: Node[] = [
      {
        id: "refined-node-1",
        title: "Human Agency",
        content: "Agency connects to [[Responsibility]].",
        rawMarkdown:
          "# Human Agency\n\nAgency connects to [[Responsibility]].",
        wikiLinks: ["Responsibility"],
      },
    ];
    const existingNotes: IndexedNote[] = [
      {
        id: "note_existing_01",
        path: "Byblos/notes/responsibility.md",
        title: "Responsibility",
        normalizedTitle: "responsibility",
        aliases: [],
        tags: [],
        content: "Responsibility note",
        rawMarkdown: "# Responsibility\n\nResponsibility note",
        titleTokens: ["responsibility"],
        contentTokens: ["responsibility", "note"],
        aliasTokens: [],
        tagTokens: [],
        outgoingWikiLinks: [],
        outgoingTypedLinks: [],
      },
    ];

    const committed = await commitNotes({
      nodes,
      proposedLinks: [
        {
          source: "Human Agency",
          target: "Responsibility",
          type: "extends",
        },
      ],
      existingNotes,
      buildPathForTitle: (title) => `Byblos/notes/${title.toLowerCase().replace(/\s+/g, "-")}.md`,
      noteExists: async () => false,
      writeCanonicalNote: async (path, content) => {
        writes.push({ path, content });
      },
      hasUnmanagedNoteWithTitle: async () => false,
      now: () => new Date("2026-04-20T12:34:56.000Z"),
    });

    expect(committed.committed).toHaveLength(1);
    expect(writes[0]?.path).toBe("Byblos/notes/human-agency.md");
    expect(writes[0]?.content).toContain("targetId: note_existing_01");
    expect(writes[0]?.content).toContain("# Human Agency");
    expect(committed.unresolvedWikiLinks).toEqual([]);
  });

  it("keeps unresolved links in body but does not emit typed links", async () => {
    const writes: Array<{ path: string; content: string }> = [];
    const node: Node = {
      id: "refined-node-1",
      title: "Human Agency",
      content: "Agency connects to [[Missing Note]].",
      rawMarkdown: "# Human Agency\n\nAgency connects to [[Missing Note]].",
      wikiLinks: ["Missing Note"],
    };

    const committed = await commitNotes({
      nodes: [node],
      existingNotes: [],
      buildPathForTitle: () => "Byblos/notes/human-agency.md",
      noteExists: async () => false,
      writeCanonicalNote: async (path, content) => {
        writes.push({ path, content });
      },
      hasUnmanagedNoteWithTitle: async () => false,
      now: () => new Date("2026-04-20T12:34:56.000Z"),
    });

    expect(committed.unresolvedWikiLinks).toEqual([
      {
        sourceTitle: "Human Agency",
        targetTitle: "Missing Note",
      },
    ]);
    expect(writes[0]?.content).toContain("[[Missing Note]]");
    expect(writes[0]?.content).toContain("links: []");
  });

  it("creates a linked continuation when title collides with an existing note", async () => {
    const writes: Array<{ path: string; content: string }> = [];
    const nodes: Node[] = [
      {
        id: "refined-node-1",
        title: "Хацберг",
        content: "Развитие идеи о Хацберг.",
        rawMarkdown: "# Хацберг\n\nРазвитие идеи о Хацберг.",
        wikiLinks: [],
      },
    ];
    const existingNotes: IndexedNote[] = [
      {
        id: "note_existing_hazberg",
        path: "Byblos/notes/hatsberg.md",
        title: "Хацберг",
        normalizedTitle: "хацберг",
        aliases: [],
        tags: [],
        content: "Исходная заметка",
        rawMarkdown: "# Хацберг\n\nИсходная заметка",
        titleTokens: ["хацберг"],
        contentTokens: ["исходная", "заметка"],
        aliasTokens: [],
        tagTokens: [],
        outgoingWikiLinks: [],
        outgoingTypedLinks: [],
      },
    ];

    const committed = await commitNotes({
      nodes,
      existingNotes,
      buildPathForTitle: (title) =>
        `Byblos/notes/${title.toLowerCase().replace(/\s+/g, "-")}.md`,
      noteExists: async () => false,
      writeCanonicalNote: async (path, content) => {
        writes.push({ path, content });
      },
      hasUnmanagedNoteWithTitle: async () => false,
      now: () => new Date("2026-04-20T12:34:56.000Z"),
    });

    expect(committed.committed).toEqual([
      {
        id: "note_20260420123456_01",
        title: "Хацберг: развитие",
        path: "Byblos/notes/хацберг:-развитие.md",
      },
    ]);
    expect(writes[0]?.content).toContain("# Хацберг: развитие");
    expect(writes[0]?.content).toContain("Связано с [[Хацберг]].");
    expect(writes[0]?.content).toContain("targetId: note_existing_hazberg");
    expect(committed.unresolvedWikiLinks).toEqual([]);
  });

  it("increments continuation suffix when the default variant title already exists", async () => {
    const writes: Array<{ path: string; content: string }> = [];
    const nodes: Node[] = [
      {
        id: "refined-node-1",
        title: "Хацберг",
        content: "Новая версия.",
        rawMarkdown: "# Хацберг\n\nНовая версия.",
        wikiLinks: [],
      },
    ];
    const existingNotes: IndexedNote[] = [
      {
        id: "origin",
        path: "Byblos/notes/hatsberg.md",
        title: "Хацберг",
        normalizedTitle: "хацберг",
        aliases: [],
        tags: [],
        content: "Origin",
        rawMarkdown: "# Хацберг\n\nOrigin",
        titleTokens: ["хацберг"],
        contentTokens: ["origin"],
        aliasTokens: [],
        tagTokens: [],
        outgoingWikiLinks: [],
        outgoingTypedLinks: [],
      },
      {
        id: "variant-1",
        path: "Byblos/notes/hatsberg-dev.md",
        title: "Хацберг: развитие",
        normalizedTitle: "хацберг развитие",
        aliases: [],
        tags: [],
        content: "Variant 1",
        rawMarkdown: "# Хацберг: развитие\n\nVariant 1",
        titleTokens: ["хацберг", "развитие"],
        contentTokens: ["variant"],
        aliasTokens: [],
        tagTokens: [],
        outgoingWikiLinks: [],
        outgoingTypedLinks: [],
      },
    ];

    const committed = await commitNotes({
      nodes,
      existingNotes,
      buildPathForTitle: (title) =>
        `Byblos/notes/${title.toLowerCase().replace(/\s+/g, "-")}.md`,
      noteExists: async () => false,
      writeCanonicalNote: async (path, content) => {
        writes.push({ path, content });
      },
      hasUnmanagedNoteWithTitle: async () => false,
      now: () => new Date("2026-04-20T12:34:56.000Z"),
    });

    expect(committed.committed[0]?.title).toBe("Хацберг: развитие 2");
    expect(writes[0]?.content).toContain("# Хацберг: развитие 2");
  });
  it("resolves managed wikilinks through aliases", async () => {
    const writes: Array<{ path: string; content: string }> = [];
    const nodes: Node[] = [
      {
        id: "refined-node-1",
        title: "Village Elder",
        content: "The elder protects [[Hatsberg]].",
        rawMarkdown: "# Village Elder\n\nThe elder protects [[Hatsberg]].",
        wikiLinks: ["Hatsberg"],
      },
    ];
    const existingNotes: IndexedNote[] = [
      {
        id: "note_existing_01",
        path: "Byblos/notes/History of Hatsberg.md",
        title: "History of Hatsberg",
        normalizedTitle: "history of hatsberg",
        aliases: ["Hatsberg"],
        tags: [],
        content: "Settlement history.",
        rawMarkdown: "# History of Hatsberg\n\nSettlement history.",
        titleTokens: ["history", "of", "hatsberg"],
        contentTokens: ["settlement", "history"],
        aliasTokens: ["hatsberg"],
        tagTokens: [],
        outgoingWikiLinks: [],
        outgoingTypedLinks: [],
      },
    ];

    const committed = await commitNotes({
      nodes,
      proposedLinks: [
        {
          source: "Village Elder",
          target: "Hatsberg",
          type: "extends",
        },
      ],
      existingNotes,
      buildPathForTitle: (title) => `Byblos/notes/${title}.md`,
      noteExists: async () => false,
      writeCanonicalNote: async (path, content) => {
        writes.push({ path, content });
      },
      hasUnmanagedNoteWithTitle: async () => false,
      now: () => new Date("2026-04-20T12:34:56.000Z"),
    });

    expect(writes[0]?.content).toContain("targetId: note_existing_01");
    expect(committed.unresolvedWikiLinks).toEqual([]);
  });
});
