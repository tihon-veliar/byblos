import type {
  MatchSignal,
  NoteMatch,
  RetrievalResult,
  SearchQuery,
} from "../../core/pipeline/contracts";
import type { IndexedNote, NoteIndexSnapshot } from "../types";
import { normalizeTitle, tokenizeText } from "../normalize";

const STRONG_THRESHOLD = 35;
const RELATED_THRESHOLD = 8;

export function rankLexicalMatches(
  query: SearchQuery,
  snapshot: NoteIndexSnapshot,
): RetrievalResult {
  const normalizedQuery = normalizeTitle(query.text);
  const queryTokens = tokenizeText(query.text);
  const excludedIds = new Set(query.excludeIds ?? []);

  const ranked = snapshot.notes
    .filter((note) => !excludedIds.has(note.id))
    .map((note) => scoreNote(note, normalizedQuery, queryTokens))
    .filter((match): match is NoteMatch => match !== null)
    .sort(compareMatches);

  const strong = ranked.filter((match) => match.bucket === "strong");
  const related = ranked.filter((match) => match.bucket === "related");
  const limitedStrong = strong.slice(0, query.limit);
  const remaining = Math.max(query.limit - limitedStrong.length, 0);
  const limitedRelated = related.slice(0, remaining);

  return {
    query,
    strong: limitedStrong,
    related: limitedRelated,
  };
}

function scoreNote(
  note: IndexedNote,
  normalizedQuery: string,
  queryTokens: string[],
): NoteMatch | null {
  if (!normalizedQuery && queryTokens.length === 0) {
    return null;
  }

  let score = 0;
  const signals: MatchSignal[] = [];
  const reasons: string[] = [];

  if (normalizedQuery && note.normalizedTitle === normalizedQuery) {
    score += 100;
    signals.push("exact_title");
    reasons.push("exact title match");
  }

  if (note.aliases.some((alias) => normalizeTitle(alias) === normalizedQuery)) {
    score += 75;
    signals.push("alias_match");
    reasons.push("exact alias match");
  }

  const titleOverlap = overlapCount(queryTokens, note.titleTokens);
  if (titleOverlap > 0) {
    score += titleOverlap * 16;
    signals.push("title_overlap");
    reasons.push(`title overlap (${titleOverlap})`);
  }

  if (
    queryTokens.length > 1 &&
    queryTokens.every((token) => note.titleTokens.includes(token))
  ) {
    score += 18;
  }

  const aliasOverlap = overlapCount(queryTokens, note.aliasTokens);
  if (aliasOverlap > 0 && !signals.includes("alias_match")) {
    score += aliasOverlap * 10;
    signals.push("alias_match");
    reasons.push(`alias overlap (${aliasOverlap})`);
  }

  const contentOverlap = overlapCount(queryTokens, note.contentTokens);
  if (contentOverlap > 0) {
    score += contentOverlap * 6;
    signals.push("content_overlap");
    reasons.push(`content overlap (${contentOverlap})`);
  }

  const wikiOverlap = overlapCount(
    queryTokens,
    tokenizeText(note.outgoingWikiLinks.join(" ")),
  );
  if (wikiOverlap > 0) {
    score += wikiOverlap * 2;
    signals.push("wikilink_overlap");
    reasons.push(`wikilink overlap (${wikiOverlap})`);
  }

  const tagOverlap = overlapCount(queryTokens, note.tagTokens);
  if (tagOverlap > 0) {
    score += tagOverlap;
    signals.push("tag_overlap");
    reasons.push(`tag overlap (${tagOverlap})`);
  }

  if (score < RELATED_THRESHOLD) {
    return null;
  }

  return {
    noteId: note.id,
    title: note.title,
    path: note.path,
    bucket: score >= STRONG_THRESHOLD ? "strong" : "related",
    score,
    signals,
    reason: reasons.join(", "),
  };
}

function overlapCount(queryTokens: string[], fieldTokens: string[]): number {
  return queryTokens.filter((token) => fieldTokens.includes(token)).length;
}

function compareMatches(left: NoteMatch, right: NoteMatch): number {
  return (
    right.score - left.score ||
    left.title.localeCompare(right.title) ||
    left.noteId.localeCompare(right.noteId)
  );
}
