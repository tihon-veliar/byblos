export type TypedLinkIndexEntry = {
  type: string;
  targetId: string;
};

export type IndexedNote = {
  id: string;
  path: string;
  title: string;
  normalizedTitle: string;
  aliases: string[];
  tags: string[];
  type?: string;
  epistemicMode?: string;
  claimStatus?: string;
  reviewStatus?: string;
  content: string;
  rawMarkdown: string;
  titleTokens: string[];
  contentTokens: string[];
  aliasTokens: string[];
  tagTokens: string[];
  outgoingWikiLinks: string[];
  outgoingTypedLinks: TypedLinkIndexEntry[];
};

export type TitleLookup = {
  byNormalizedTitle: Record<string, string>;
  byAlias: Record<string, string[]>;
};

export type LinkGraphIndex = {
  outgoingById: Record<string, string[]>;
  incomingById: Record<string, string[]>;
};

export type BuildMeta = {
  version: 1;
  builtAt: string;
  noteCount: number;
};

export type NoteIndexSnapshot = {
  notes: IndexedNote[];
  graph: LinkGraphIndex;
  buildMeta: BuildMeta;
  titleLookup: TitleLookup;
};
