import { describe, expect, it } from "vitest";

import type { Match } from "./contracts";
import { ContextBuilder } from "./ContextBuilder";

describe("ContextBuilder", () => {
  it("selects a strong match as primary", () => {
    const matches: Match[] = [
      { id: "m-1", title: "Related One", score: 0.6, type: "related" },
      { id: "m-2", title: "Primary Match", score: 0.95, type: "strong" },
      { id: "m-3", title: "Related Two", score: 0.55, type: "related" },
    ];

    const context = ContextBuilder.build(matches);

    expect(context.primary).toEqual(matches[1]);
    expect(context.related).toEqual([matches[0], matches[2]]);
  });

  it("caps related matches at the current bound and excludes the primary match", () => {
    const matches: Match[] = [
      { id: "m-1", title: "Primary Match", score: 0.95, type: "strong" },
      { id: "m-2", title: "Related One", score: 0.7, type: "related" },
      { id: "m-3", title: "Related Two", score: 0.68, type: "related" },
      { id: "m-4", title: "Related Three", score: 0.65, type: "related" },
      { id: "m-5", title: "Related Four", score: 0.63, type: "related" },
      { id: "m-6", title: "Related Five", score: 0.61, type: "related" },
    ];

    const context = ContextBuilder.build(matches);

    expect(context.primary).toEqual(matches[0]);
    expect(context.related).toHaveLength(4);
    expect(context.related).toEqual(matches.slice(1, 5));
    expect(context.related).not.toContain(matches[0]);
  });

  it("returns a valid minimal context for empty matches", () => {
    const context = ContextBuilder.build([]);

    expect(context).toEqual({
      primary: undefined,
      related: [],
    });
  });
});
