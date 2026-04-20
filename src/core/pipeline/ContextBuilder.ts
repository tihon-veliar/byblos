import type { PipelineModules } from "./pipeline-modules";
import type { ContextItem, NoteMatch } from "./contracts";
import { normalizeTitle } from "../../indexing/normalize";

const GENERATION_SUPPORTING_LIMIT = 3;
const REFINEMENT_SUPPORTING_LIMIT = 4;
const MAX_STRONG_SUPPORTING = 2;
const MAX_RELATED_SUPPORTING = 2;

export const ContextBuilder: PipelineModules["ContextBuilder"] = {
  build({
    stage,
    retrieval,
    resolveNote,
    getNeighborLookup,
  }) {
    const trace: string[] = [];
    const omitted: Array<{ noteId: string; reason: string }> = [];
    const supporting: ContextItem[] = [];
    const directMatches = [...retrieval.strong, ...retrieval.related];
    const primaryMatch = retrieval.strong[0];
    const primary = primaryMatch
      ? buildContextItem(primaryMatch, "primary", resolveNote, trace)
      : undefined;

    if (!primaryMatch) {
      trace.push("No strong match selected as primary.");
    }

    for (const match of retrieval.strong.slice(1, 1 + MAX_STRONG_SUPPORTING)) {
      if (primary && isNearDuplicateTitle(primary.title, match.title)) {
        omitted.push({
          noteId: match.noteId,
          reason: "near-duplicate title of primary",
        });
        trace.push(`Omitted ${match.title} because it duplicates the primary title.`);
        continue;
      }

      const item = buildContextItem(match, "supporting", resolveNote, trace);
      if (item) {
        supporting.push(item);
      }
    }

    for (const match of retrieval.related.slice(0, MAX_RELATED_SUPPORTING)) {
      const item = buildContextItem(match, "supporting", resolveNote, trace);
      if (item) {
        supporting.push(item);
      }
    }

    const supportingLimit =
      stage === "generation"
        ? GENERATION_SUPPORTING_LIMIT
        : REFINEMENT_SUPPORTING_LIMIT;
    const dedupedSupporting = dedupeContextItems(supporting).slice(
      0,
      supportingLimit,
    );

    if (primary && stage === "refinement") {
      const neighbors = getNeighborLookup(primary.noteId);
      const neighborId = neighbors?.outgoing.find(
        (noteId) => !directMatches.some((match) => match.noteId === noteId),
      );

      if (neighborId && dedupedSupporting.length < supportingLimit) {
        const neighborNote = resolveNote(neighborId);

        if (neighborNote) {
          dedupedSupporting.push({
            noteId: neighborNote.id,
            title: neighborNote.title,
            path: neighborNote.path,
            content: neighborNote.content,
            role: "neighbor",
            includedBecause: `directly linked one-hop neighbor of ${primary.title}`,
          });
          trace.push(
            `Included ${neighborNote.title} as a neighbor because it is directly linked from ${primary.title}.`,
          );
        }
      }
    }

    for (const match of directMatches) {
      if (
        match.noteId !== primary?.noteId &&
        !dedupedSupporting.some((item) => item.noteId === match.noteId)
      ) {
        omitted.push({
          noteId: match.noteId,
          reason: "outside bounded context limit",
        });
      }
    }

    return {
      stage,
      primary,
      supporting: dedupedSupporting,
      omitted,
      trace,
    };
  },
};

function buildContextItem(
  match: NoteMatch,
  role: ContextItem["role"],
  resolveNote: (noteId: string) => ReturnType<PipelineModules["SearchModule"]["getNoteById"]>,
  trace: string[],
): ContextItem | undefined {
  const note = resolveNote(match.noteId);

  if (!note) {
    trace.push(`Skipped ${match.title} because its indexed content was unavailable.`);
    return undefined;
  }

  const includedBecause = match.reason || "retrieval match";
  trace.push(`Included ${match.title} as ${role} because of ${includedBecause}.`);

  return {
    noteId: note.id,
    title: note.title,
    path: note.path,
    content: note.content,
    role,
    sourceMatch: match,
    includedBecause,
  };
}

function dedupeContextItems(items: ContextItem[]): ContextItem[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const deduped: ContextItem[] = [];

  for (const item of items) {
    const normalizedTitle = normalizeTitle(item.title);

    if (seenIds.has(item.noteId) || seenTitles.has(normalizedTitle)) {
      continue;
    }

    seenIds.add(item.noteId);
    seenTitles.add(normalizedTitle);
    deduped.push(item);
  }

  return deduped;
}

function isNearDuplicateTitle(left: string, right: string): boolean {
  return normalizeTitle(left) === normalizeTitle(right);
}
