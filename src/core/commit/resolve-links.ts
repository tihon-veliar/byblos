import type { Link, Node } from "../pipeline/contracts";
import type { IndexedNote } from "../../indexing/types";
import { normalizeTitle } from "../../indexing/normalize";

export type ResolvedTypedLink = {
  type: string;
  targetId: string;
};

export type CommitCandidate = {
  node: Node;
  id: string;
  path: string;
};

export async function resolveCommitLinks(input: {
  candidates: CommitCandidate[];
  existingNotes: IndexedNote[];
  hasUnmanagedNoteWithTitle: (title: string) => Promise<boolean>;
  proposedLinks?: Link[];
}): Promise<Map<string, ResolvedTypedLink[]>> {
  const byGeneratedTitle = new Map<string, CommitCandidate>();
  const byExistingTitle = new Map<string, IndexedNote[]>();

  for (const note of input.existingNotes) {
    const key = normalizeTitle(note.title);
    const current = byExistingTitle.get(key) ?? [];
    byExistingTitle.set(key, [...current, note]);
  }

  for (const candidate of input.candidates) {
    const normalized = normalizeTitle(candidate.node.title);

    if (byGeneratedTitle.has(normalized)) {
      throw new Error(`Duplicate generated title: ${candidate.node.title}`);
    }

    if (byExistingTitle.has(normalized)) {
      throw new Error(`Managed note already exists for title: ${candidate.node.title}`);
    }

    byGeneratedTitle.set(normalized, candidate);
  }

  if (input.proposedLinks?.length) {
    validateProposedLinks(input.candidates, input.proposedLinks);
  }

  const resolvedBySourceId = new Map<string, ResolvedTypedLink[]>();

  for (const candidate of input.candidates) {
    const resolved: ResolvedTypedLink[] = [];

    for (const targetTitle of Array.from(new Set(candidate.node.wikiLinks))) {
      const normalizedTarget = normalizeTitle(targetTitle);
      const generatedTarget = byGeneratedTitle.get(normalizedTarget);

      if (generatedTarget) {
        resolved.push({ type: "extends", targetId: generatedTarget.id });
        continue;
      }

      const existingTargets = byExistingTitle.get(normalizedTarget) ?? [];

      if (existingTargets.length > 1) {
        throw new Error(`Ambiguous managed note link target: ${targetTitle}`);
      }

      if (existingTargets.length === 1) {
        resolved.push({ type: "extends", targetId: existingTargets[0].id });
        continue;
      }

      if (await input.hasUnmanagedNoteWithTitle(targetTitle)) {
        continue;
      }

      throw new Error(`Unresolved managed note link target: ${targetTitle}`);
    }

    resolvedBySourceId.set(candidate.id, resolved);
  }

  return resolvedBySourceId;
}

function validateProposedLinks(candidates: CommitCandidate[], proposedLinks: Link[]): void {
  const wikiTargetsBySource = new Map<string, Set<string>>();

  for (const candidate of candidates) {
    wikiTargetsBySource.set(
      candidate.node.title,
      new Set(candidate.node.wikiLinks.map((target) => normalizeTitle(target))),
    );
  }

  for (const link of proposedLinks) {
    const sourceTargets = wikiTargetsBySource.get(link.source);

    if (!sourceTargets || !sourceTargets.has(normalizeTitle(link.target))) {
      throw new Error(
        `Typed link without matching body wikilink: ${link.source} -> ${link.target}`,
      );
    }
  }
}
