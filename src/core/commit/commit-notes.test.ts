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

    expect(committed).toHaveLength(1);
    expect(writes[0]?.path).toBe("Byblos/notes/human-agency.md");
    expect(writes[0]?.content).toContain("targetId: note_existing_01");
    expect(writes[0]?.content).toContain("# Human Agency");
  });

  it("rejects unresolved managed-note links", async () => {
    const node: Node = {
      id: "refined-node-1",
      title: "Human Agency",
      content: "Agency connects to [[Missing Note]].",
      rawMarkdown: "# Human Agency\n\nAgency connects to [[Missing Note]].",
      wikiLinks: ["Missing Note"],
    };

    await expect(
      commitNotes({
        nodes: [node],
        existingNotes: [],
        buildPathForTitle: () => "Byblos/notes/human-agency.md",
        noteExists: async () => false,
        writeCanonicalNote: vi.fn(),
        hasUnmanagedNoteWithTitle: async () => false,
        now: () => new Date("2026-04-20T12:34:56.000Z"),
      }),
    ).rejects.toThrow("Unresolved managed note link target: Missing Note");
  });
});
