import { describe, expect, it, vi } from "vitest";

import type {
  GenerationContext,
  GenerationDraft,
  Link,
  Match,
  Node,
} from "./contracts";
import type { PipelineModules } from "./pipeline-modules";
import { ContextBuilder } from "./ContextBuilder";
import { normalize } from "./Normalizer";
import { PipelineOrchestrator } from "./PipelineOrchestrator";
import { ResultAssembler } from "./ResultAssembler";
import { SearchModule } from "../../indexing/search/SearchModule";
import { GenerationModule } from "../../llm/generation/GenerationModule";
import { propose } from "../../llm/linking/LinkProposalModule";
import { RefinementModule } from "../../llm/refinement/RefinementModule";

describe("PipelineOrchestrator", () => {
  it("calls modules in Stage 2 draft-first order and uses draft retrieval fields for search-2", () => {
    const steps: string[] = [];
    const initialMatches: Match[] = [
      { id: "m-1", title: "Initial Match", score: 0.8, type: "related" },
    ];
    const generatedMatches: Match[] = [
      { id: "m-2", title: "Generated Match", score: 0.7, type: "related" },
    ];
    const context1: GenerationContext = {
      primary: { id: "ctx-1", title: "Primary Context" },
      related: [],
    };
    const context2: GenerationContext = {
      primary: { id: "ctx-2", title: "Combined Context" },
      related: [{ id: "ctx-3", title: "Neighbor Context" }],
    };
    const draft: GenerationDraft = {
      content: "Draft content",
      retrievalSeed: "seed",
      retrievalQueries: ["alpha", "beta"],
    };
    const refinedNodes: Node[] = [
      { id: "node-1", title: "Node 1", content: "Content 1" },
    ];
    const refinedLinks: Link[] = [
      { source: "Node 1", target: "Initial Match", type: "extends" },
    ];
    const finalResult = {
      nodes: refinedNodes,
      matches: {
        initial: initialMatches,
        generated: generatedMatches,
      },
      links: refinedLinks,
      status: "seed",
    } as const;

    const modules: PipelineModules = {
      Normalizer: {
        normalize: vi.fn((text: string) => {
          steps.push("normalize");
          expect(text).toBe("  noisy input  ");
          return "normalized input";
        }),
      },
      SearchModule: {
        search: vi.fn((query: string) => {
          if (steps.length === 1) {
            steps.push("search-1");
            expect(query).toBe("normalized input");
            return initialMatches;
          }

          steps.push("search-2");
          expect(query).toBe("seed alpha beta");
          return generatedMatches;
        }),
      },
      ContextBuilder: {
        build: vi.fn((matches: Match[]) => {
          if (steps.at(-1) === "search-1") {
            steps.push("context-1");
            expect(matches).toHaveLength(1);
            return context1;
          }

          steps.push("context-2");
          expect(matches).toHaveLength(2);
          return context2;
        }),
      },
      GenerationModule: {
        generate: vi.fn(
          (input: { text: string; context: GenerationContext }) => {
            steps.push("generate");
            expect(input.text).toBe("normalized input");
            expect(input.context).toBe(context1);
            return draft;
          },
        ),
      },
      RefinementModule: {
        refine: vi.fn(
          (input: {
            draft: GenerationDraft;
            context: GenerationContext;
            matches: Match[];
          }) => {
            steps.push("refine");
            expect(input.draft).toBe(draft);
            expect(input.context).toBe(context2);
            expect(input.matches).toHaveLength(2);
            return {
              nodes: refinedNodes,
              links: [],
            };
          },
        ),
      },
      LinkProposalModule: {
        propose: vi.fn((input: { nodes: Node[]; matches: Match[] }) => {
          steps.push("link");
          expect(input.nodes).toBe(refinedNodes);
          expect(input.matches).toBe(generatedMatches);
          return refinedLinks;
        }),
      },
      ResultAssembler: {
        assemble: vi.fn((input) => {
          steps.push("assemble");
          expect(input.nodes).toBe(refinedNodes);
          expect(input.links).toHaveLength(1);
          expect(input.links[0]).toBe(refinedLinks[0]);
          expect(input.matches.initial).toBe(initialMatches);
          expect(input.matches.generated).toBe(generatedMatches);
          return finalResult;
        }),
      },
    };

    const orchestrator = new PipelineOrchestrator(modules, { log: vi.fn() });

    const result = orchestrator.run({ text: "  noisy input  " });

    expect(result).toBe(finalResult);
    expect(steps).toEqual([
      "normalize",
      "search-1",
      "context-1",
      "generate",
      "search-2",
      "context-2",
      "refine",
      "link",
      "assemble",
    ]);
  });

  it("does not crash on empty or noisy input", () => {
    const orchestrator = createRealOrchestrator();

    expect(() => orchestrator.run({ text: "" })).not.toThrow();
    expect(() =>
      orchestrator.run({ text: "   meaning   and   symbol   " }),
    ).not.toThrow();
  });
});

function createRealOrchestrator(): PipelineOrchestrator {
  return new PipelineOrchestrator(
    {
      Normalizer: { normalize },
      SearchModule,
      ContextBuilder,
      GenerationModule,
      RefinementModule,
      LinkProposalModule: { propose },
      ResultAssembler,
    },
    { log: vi.fn() },
  );
}
