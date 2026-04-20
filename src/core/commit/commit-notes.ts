import type { Link, Node } from "../pipeline/contracts";
import { buildCanonicalNote } from "./build-canonical-note";
import { resolveCommitLinks } from "./resolve-links";
import type { IndexedNote } from "../../indexing/types";

export async function commitNotes(input: {
  nodes: Node[];
  proposedLinks?: Link[];
  existingNotes: IndexedNote[];
  buildPathForTitle: (title: string) => string;
  noteExists: (path: string) => Promise<boolean>;
  writeCanonicalNote: (path: string, content: string) => Promise<void>;
  hasUnmanagedNoteWithTitle: (title: string) => Promise<boolean>;
  now?: () => Date;
}): Promise<Array<{ id: string; title: string; path: string }>> {
  const now = input.now ?? (() => new Date());
  const timestamp = now().toISOString();
  const candidates = [];

  for (let index = 0; index < input.nodes.length; index += 1) {
    const node = input.nodes[index];
    const id = buildPersistentId(now(), index);
    const path = input.buildPathForTitle(node.title);

    if (await input.noteExists(path)) {
      throw new Error(`Managed note path already exists: ${path}`);
    }

    candidates.push({
      node,
      id,
      path,
    });
  }

  const resolvedLinks = await resolveCommitLinks({
    candidates,
    existingNotes: input.existingNotes,
    hasUnmanagedNoteWithTitle: input.hasUnmanagedNoteWithTitle,
    proposedLinks: input.proposedLinks,
  });

  for (const candidate of candidates) {
    const content = buildCanonicalNote({
      node: candidate.node,
      id: candidate.id,
      typedLinks: resolvedLinks.get(candidate.id) ?? [],
      createdAt: timestamp,
      committedAt: timestamp,
    });

    await input.writeCanonicalNote(candidate.path, content);
  }

  return candidates.map(({ id, node, path }) => ({
    id,
    title: node.title,
    path,
  }));
}

function buildPersistentId(now: Date, index: number): string {
  const stamp = now
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  return `note_${stamp}_${String(index + 1).padStart(2, "0")}`;
}
