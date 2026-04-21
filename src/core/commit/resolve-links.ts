import type { Link, Node } from "../pipeline/contracts";
import type { IndexedNote } from "../../indexing/types";
import { normalizeTitle } from "../../indexing/normalize";

export type ResolvedTypedLink = {
  type: string;
  targetId: string;
};

export type UnresolvedWikiLink = {
  sourceTitle: string;
  targetTitle: string;
};

export type CommitCandidate = {
  node: Node;
  id: string;
  path: string;
  originalTitle: string;
  autoOriginLink?: ResolvedTypedLink;
};

export async function resolveCommitLinks(input: {
  candidates: CommitCandidate[];
  existingNotes: IndexedNote[];
  hasUnmanagedNoteWithTitle: (title: string) => Promise<boolean>;
  proposedLinks?: Link[];
}): Promise<{
  typedLinksBySourceId: Map<string, ResolvedTypedLink[]>;
  unresolvedWikiLinks: UnresolvedWikiLink[];
}> {
  const byGeneratedTitle = new Map<string, CommitCandidate>();
  const byExistingTarget = new Map<string, IndexedNote[]>();

  for (const note of input.existingNotes) {
    addExistingTarget(byExistingTarget, note.title, note);

    for (const alias of note.aliases) {
      addExistingTarget(byExistingTarget, alias, note);
    }
  }

  for (const candidate of input.candidates) {
    const normalized = normalizeTitle(candidate.node.title);

    if (byGeneratedTitle.has(normalized)) {
      throw new Error(`Duplicate generated title: ${candidate.node.title}`);
    }

    if (byExistingTarget.has(normalized)) {
      throw new Error(`Managed note already exists for title: ${candidate.node.title}`);
    }

    byGeneratedTitle.set(normalized, candidate);
  }

  if (input.proposedLinks?.length) {
    validateProposedLinks(input.candidates, input.proposedLinks);
  }

  const resolvedBySourceId = new Map<string, ResolvedTypedLink[]>();
  const unresolvedWikiLinks: UnresolvedWikiLink[] = [];

  for (const candidate of input.candidates) {
    const resolved: ResolvedTypedLink[] = candidate.autoOriginLink
      ? [candidate.autoOriginLink]
      : [];

    for (const targetTitle of Array.from(new Set(candidate.node.wikiLinks))) {
      const normalizedTarget = normalizeTitle(targetTitle);
      const generatedTarget = byGeneratedTitle.get(normalizedTarget);

      if (generatedTarget) {
        resolved.push({ type: "extends", targetId: generatedTarget.id });
        continue;
      }

      const existingTargets = byExistingTarget.get(normalizedTarget) ?? [];

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

      unresolvedWikiLinks.push({
        sourceTitle: candidate.node.title,
        targetTitle,
      });
    }

    resolvedBySourceId.set(candidate.id, dedupeTypedLinks(resolved));
  }

  return {
    typedLinksBySourceId: resolvedBySourceId,
    unresolvedWikiLinks,
  };
}

function addExistingTarget(
  targets: Map<string, IndexedNote[]>,
  value: string,
  note: IndexedNote,
): void {
  const normalized = normalizeTitle(value);

  if (!normalized) {
    return;
  }

  const current = targets.get(normalized) ?? [];

  if (current.some((existing) => existing.id === note.id)) {
    return;
  }

  targets.set(normalized, [...current, note]);
}

function dedupeTypedLinks(links: ResolvedTypedLink[]): ResolvedTypedLink[] {
  const seen = new Set<string>();

  return links.filter((link) => {
    const key = `${link.type}:${link.targetId}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function validateProposedLinks(candidates: CommitCandidate[], proposedLinks: Link[]): void {
  const wikiTargetsBySource = new Map<string, Set<string>>();

  for (const candidate of candidates) {
    const targets = new Set(
      candidate.node.wikiLinks.map((target) => normalizeTitle(target)),
    );
    wikiTargetsBySource.set(candidate.node.title, targets);
    wikiTargetsBySource.set(candidate.originalTitle, targets);
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
