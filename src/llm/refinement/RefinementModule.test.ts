import { describe, expect, it } from "vitest";

import type {
  GenerationContext,
  GenerationDraft,
} from "../../core/pipeline/contracts";
import { RefinementModule } from "./RefinementModule";

describe("RefinementModule", () => {
  it("returns nodes and links arrays for minimal input without crashing", () => {
    const draft: GenerationDraft = {
      content: "Draft note body",
      retrievalQueries: [],
      retrievalSeed: "seed idea",
    };
    const context: GenerationContext = {
      related: [],
    };

    const result = RefinementModule.refine({
      draft,
      context,
      matches: [],
    });

    expect(Array.isArray(result.nodes)).toBe(true);
    expect(Array.isArray(result.links)).toBe(true);
    expect(result.nodes.length).toBeGreaterThan(0);
  });

  it("can surface extracted wikilinks as link objects when the stub emits them", () => {
    const draft: GenerationDraft = {
      content: "Draft note body",
      retrievalQueries: ["related idea"],
      retrievalSeed: "seed idea",
    };
    const context: GenerationContext = {
      primary: { id: "ctx-1", title: "Context Anchor" },
      related: [],
    };

    const result = RefinementModule.refine({
      draft,
      context,
      matches: [],
    });

    expect(Array.isArray(result.links)).toBe(true);
    expect(result.links.length).toBeGreaterThan(0);
    expect(result.links[0]).toMatchObject({
      source: expect.any(String),
      target: expect.any(String),
      type: "extends",
    });
  });
});
