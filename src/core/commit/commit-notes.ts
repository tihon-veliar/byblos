import type { Link, Node } from "../pipeline/contracts";
import { buildCanonicalNote } from "./build-canonical-note";
import { resolveCommitLinks } from "./resolve-links";
import type { IndexedNote } from "../../indexing/types";
import { resolveTitleCollision } from "./resolve-title-collision";
import { injectOriginLink } from "./inject-origin-link";
import type { UnresolvedWikiLink } from "./resolve-links";

export type CommitNotesResult = {
  committed: Array<{ id: string; title: string; path: string }>;
  unresolvedWikiLinks: UnresolvedWikiLink[];
};

export async function commitNotes(input: {
  nodes: Node[];
  proposedLinks?: Link[];
  existingNotes: IndexedNote[];
  buildPathForTitle: (title: string) => string;
  noteExists: (path: string) => Promise<boolean>;
  writeCanonicalNote: (path: string, content: string) => Promise<void>;
  hasUnmanagedNoteWithTitle: (title: string) => Promise<boolean>;
  now?: () => Date;
}): Promise<CommitNotesResult> {
  const now = input.now ?? (() => new Date());
  const timestamp = now().toISOString();
  const candidates = [];
  const reservedTitles: string[] = [];
  const reservedPaths = new Set<string>();

  for (let index = 0; index < input.nodes.length; index += 1) {
    const originalNode = input.nodes[index];
    const collisionResolution = resolveTitleCollision({
      requestedTitle: originalNode.title,
      existingNotes: input.existingNotes.map((note) => ({
        id: note.id,
        title: note.title,
      })),
      reservedTitles,
    });
    let node = originalNode;

    if (collisionResolution.kind === "linked_variant") {
      node = injectOriginLink(
        {
          ...originalNode,
          title: collisionResolution.title,
        },
        collisionResolution.originTitle,
      );
    }

    const id = buildPersistentId(now(), index);
    const path = input.buildPathForTitle(node.title);

    if (reservedPaths.has(path)) {
      throw new Error(`Managed note path already reserved: ${path}`);
    }

    if (await input.noteExists(path)) {
      throw new Error(`Managed note path already exists: ${path}`);
    }

    candidates.push({
      node,
      id,
      path,
      originalTitle: originalNode.title,
      autoOriginLink:
        collisionResolution.kind === "linked_variant"
          ? {
              type: collisionResolution.linkType,
              targetId: collisionResolution.originNoteId,
            }
          : undefined,
    });
    reservedTitles.push(node.title);
    reservedPaths.add(path);
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
      typedLinks: resolvedLinks.typedLinksBySourceId.get(candidate.id) ?? [],
      createdAt: timestamp,
      committedAt: timestamp,
    });

    await input.writeCanonicalNote(candidate.path, content);
  }

  return {
    committed: candidates.map(({ id, node, path }) => ({
      id,
      title: node.title,
      path,
    })),
    unresolvedWikiLinks: resolvedLinks.unresolvedWikiLinks,
  };
}

function buildPersistentId(now: Date, index: number): string {
  const stamp = now
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  return `note_${stamp}_${String(index + 1).padStart(2, "0")}`;
}
