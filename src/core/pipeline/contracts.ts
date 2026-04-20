export interface Input {
  text: string;
}

export interface Node {
  id: string;
  title: string;
  content: string;
  rawMarkdown: string;
  wikiLinks: string[];
}

export type MatchBucket = "strong" | "related";
export type SearchStage = "search-1" | "search-2";
export type MatchSignal =
  | "exact_title"
  | "title_overlap"
  | "alias_match"
  | "content_overlap"
  | "wikilink_overlap"
  | "tag_overlap"
  | "graph_neighbor";

export interface SearchQuery {
  text: string;
  stage: SearchStage;
  limit: number;
  excludeIds?: string[];
}

export interface NoteMatch {
  noteId: string;
  title: string;
  path: string;
  bucket: MatchBucket;
  score: number;
  signals: MatchSignal[];
  reason: string;
}

export interface RetrievalResult {
  query: SearchQuery;
  strong: NoteMatch[];
  related: NoteMatch[];
}

export type ContextRole = "primary" | "supporting" | "neighbor";

export interface ContextItem {
  noteId: string;
  title: string;
  path: string;
  content: string;
  role: ContextRole;
  sourceMatch?: NoteMatch;
  includedBecause: string;
}

export interface OmittedContextItem {
  noteId: string;
  reason: string;
}

export interface GenerationContext {
  stage: "generation" | "refinement";
  primary?: ContextItem;
  supporting: ContextItem[];
  omitted: OmittedContextItem[];
  trace: string[];
}

export interface NeighborLookup {
  noteId: string;
  outgoing: string[];
  incoming: string[];
}

export type MatchGroups = {
  initial: RetrievalResult;
  generated: RetrievalResult;
};

export type LinkType = "extends" | "refines" | "contradicts";

export interface Link {
  source: string;
  target: string;
  type: LinkType;
}

export type PipelineResultStatus = "seed" | "multi";

export interface PipelineResult {
  nodes: Node[];
  matches: MatchGroups;
  links: Link[];
  status: PipelineResultStatus;
}

export type GenerationDraft = {
  content: string;
  retrievalQueries: string[];
  retrievalSeed: string;
};
