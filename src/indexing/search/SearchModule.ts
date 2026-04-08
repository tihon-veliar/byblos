import type { Match } from "../../core/pipeline/contracts";
import type { PipelineModules } from "../../core/pipeline/pipeline-modules";

type MockIndexEntry = {
  id: string;
  title: string;
  keywords: string[];
};

const MOCK_INDEX: MockIndexEntry[] = [
  {
    id: "note-human-agency",
    title: "Human Agency",
    keywords: ["human", "agency", "choice"],
  },
  {
    id: "note-meaning-making",
    title: "Meaning Making",
    keywords: ["meaning", "sense", "interpretation"],
  },
  {
    id: "note-symbolic-order",
    title: "Symbolic Order",
    keywords: ["meaning", "symbol", "language"],
  },
];

function containsKeyword(query: string, keywords: string[]): boolean {
  return keywords.some((keyword) => query.includes(keyword));
}

function toMatch(
  entry: MockIndexEntry,
  score: number,
  type: Match["type"],
): Match {
  return {
    id: entry.id,
    title: entry.title,
    score,
    type,
  };
}

export const SearchModule: PipelineModules["SearchModule"] = {
  search(query: string): Match[] {
    const normalizedQuery = query.toLowerCase();

    if (containsKeyword(normalizedQuery, ["human"])) {
      const entry = MOCK_INDEX.find((item) => item.id === "note-human-agency");

      return entry ? [toMatch(entry, 0.95, "strong")] : [];
    }

    if (containsKeyword(normalizedQuery, ["meaning"])) {
      return MOCK_INDEX.filter((entry) => entry.id !== "note-human-agency")
        .slice(0, 2)
        .map((entry, index) => toMatch(entry, 0.74 - index * 0.09, "related"));
    }

    return [];
  },
};
