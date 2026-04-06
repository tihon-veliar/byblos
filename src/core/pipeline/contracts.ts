interface Input {
  text: string;
}

interface Node {
  id: string;        // генерирует система
  title: string;
  content: string;
}

interface Match {
  id: string;        // id существующей ноды
  title: string;
  score: number;
  type: 'strong' | 'related';
}

interface Link {
  source: string;    // id новой ноды
  target: string;    // id новой или существующей ноды
  type: 'extends' | 'refines' | 'contradicts';
}

interface PipelineResult {
  nodes: Node[];     // [] если duplicate
  matches: Match[];
  links: Link[];     // internal + external
  decision: 'duplicate' | 'seed' | 'linked' | 'decompose';
}