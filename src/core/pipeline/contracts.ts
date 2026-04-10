interface Input {
  text: string;
}

interface Node {
  id: string; // генерирует система
  title: string;
  content: string;
}

export type MatchType = "strong" | "related";

interface Match {
  id: string; // id существующей ноды
  title: string;
  score: number;
  type: MatchType;
}

export type СontextItem = {
  id: string;
  title: string;
  content: string;
};

export type GenerationContext = {
  primary?: СontextItem;
  related: СontextItem[];
};
interface MatchGroups {
  initial: Match[];
  generated: Match[];
}

export type LinkType = "extends" | "refines" | "contradicts";
interface Link {
  source: string;
  target: string;
  type: LinkType;
}

type PipelineResultStatus = "seed" | "multi";

interface PipelineResult {
  nodes: Node[]; // [] если duplicate
  matches: MatchGroups;
  links: Link[]; // internal + external
  status: PipelineResultStatus;
}

type GenerationDraft = {
  content: string;
  retrievalQueries: string[];
  retrievalSeed: string;
};

export {
  Input,
  Node,
  Match,
  Link,
  PipelineResult,
  MatchGroups,
  PipelineResultStatus,
  GenerationDraft,
};
