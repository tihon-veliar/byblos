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

    expect(context.primary).toEqual({
      id: matches[1].id,
      title: matches[1].title,
      content: expect.anything(),
    });
    expect(context.related).toEqual([
      {
        id: matches[0].id,
        title: matches[0].title,
        content: expect.anything(),
      },
      {
        id: matches[2].id,
        title: matches[2].title,
        content: expect.anything(),
      },
    ]);
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

    expect(context.primary).toMatchObject({
      id: "m-1",
      title: "Primary Match",
    });

    expect(context.related).toHaveLength(4);

    expect(context.related.map((item) => item.id)).toEqual([
      "m-2",
      "m-3",
      "m-4",
      "m-5",
    ]);

    expect(context.related.map((item) => item.title)).toEqual([
      "Related One",
      "Related Two",
      "Related Three",
      "Related Four",
    ]);

    expect(context.primary?.content).toEqual(expect.any(String));
    expect(context.related[0]?.content).toEqual(expect.any(String));
  });

  it("returns a valid minimal context for empty matches", () => {
    const context = ContextBuilder.build([]);

    expect(context).toEqual({
      primary: undefined,
      related: [],
    });
  });
});
