import { describe, expect, it } from "vitest";

import { buildPrompt } from "./build-prompt";
import { composePrompt } from "./compose-prompt";
import { GENERATION_PROMPT_PRESET } from "./presets/generation";
import { REFINEMENT_PROMPT_PRESET } from "./presets/refinement";
import { serializeGenerationContext } from "./serialize-context";

import type { GenerationContext } from "../../core/pipeline/contracts";

describe("serializeGenerationContext", () => {
  it("renders primary before supporting and preserves order", () => {
    const context: GenerationContext = {
      stage: "generation",
      primary: {
        noteId: "primary",
        title: " Primary idea ",
        path: "Byblos/notes/primary.md",
        content: " Primary content ",
        role: "primary",
        includedBecause: "exact title match",
      },
      supporting: [
        {
          noteId: "s-1",
          title: " First support ",
          path: "Byblos/notes/s-1.md",
          content: " First content ",
          role: "supporting",
          includedBecause: "content overlap",
        },
        {
          noteId: "s-2",
          title: " Second support ",
          path: "Byblos/notes/s-2.md",
          content: " Second content ",
          role: "supporting",
          includedBecause: "content overlap",
        },
      ],
      omitted: [],
      trace: [],
    };

    expect(serializeGenerationContext(context)).toBe(
      [
        "PRIMARY:",
        "",
        "# Primary idea",
        "",
        "Primary content",
        "",
        "SUPPORTING:",
        "",
        "# First support",
        "",
        "First content",
        "",
        "# Second support",
        "",
        "Second content",
      ].join("\n"),
    );
  });

  it("handles missing primary by serializing only supporting items", () => {
    const context: GenerationContext = {
      stage: "generation",
      supporting: [
        {
          noteId: "s-1",
          title: "Related note",
          path: "Byblos/notes/s-1.md",
          content: "Related content",
          role: "supporting",
          includedBecause: "content overlap",
        },
      ],
      omitted: [],
      trace: [],
    };

    expect(serializeGenerationContext(context)).toBe(
      ["SUPPORTING:", "", "# Related note", "", "Related content"].join("\n"),
    );
  });

  it("returns an empty string when both primary and supporting are empty", () => {
    const context: GenerationContext = {
      stage: "generation",
      supporting: [],
      omitted: [],
      trace: [],
    };

    expect(serializeGenerationContext(context)).toBe("");
  });
});

describe("composePrompt", () => {
  it("joins sections in the provided order with a stable separator", () => {
    const prompt = composePrompt([
      { title: "FIRST", content: "one" },
      { title: "SECOND", content: "two" },
      { title: "THIRD", content: "three" },
    ]);

    expect(prompt).toBe(
      [
        "FIRST",
        "",
        "one",
        "",
        "---",
        "",
        "SECOND",
        "",
        "two",
        "",
        "---",
        "",
        "THIRD",
        "",
        "three",
      ].join("\n"),
    );
  });
});

describe("buildPrompt", () => {
  const context: GenerationContext = {
    stage: "generation",
    primary: {
      noteId: "primary",
      title: "Main context",
      path: "Byblos/notes/main-context.md",
      content: "Main context body",
      role: "primary",
      includedBecause: "exact title match",
    },
    supporting: [
      {
        noteId: "related-1",
        title: "Related context",
        path: "Byblos/notes/related-context.md",
        content: "Related context body",
        role: "supporting",
        includedBecause: "content overlap",
      },
    ],
    omitted: [],
    trace: [],
  };
  const input = "Turn this idea into notes.";

  function expectSectionOrder(prompt: string) {
    const sections = prompt
      .split("\n\n---\n\n")
      .map((section) => section.split("\n\n")[0]);

    expect(sections).toEqual([
      "ROLE",
      "OUTPUT FORMAT",
      "META FORMAT",
      "NOTE RULES",
      "TASK",
      "META SPEC",
      "CONTEXT",
      "INPUT",
    ]);
  }

  it("builds generation prompts with the fixed section order and serialized context/input", () => {
    const prompt = buildPrompt({
      preset: GENERATION_PROMPT_PRESET,
      context,
      input,
    });

    expectSectionOrder(prompt);
    expect(prompt).toContain(`TASK\n\n${GENERATION_PROMPT_PRESET.task}`);
    expect(prompt).toContain(
      `META SPEC\n\n${GENERATION_PROMPT_PRESET.metaSpec}`,
    );
    expect(prompt).toContain(
      `CONTEXT\n\n${serializeGenerationContext(context)}`,
    );
    expect(prompt).toContain(`INPUT\n\n${input}`);
  });

  it("builds refinement prompts with the same shared structure and refinement-specific sections", () => {
    const prompt = buildPrompt({
      preset: REFINEMENT_PROMPT_PRESET,
      context: { ...context, stage: "refinement" },
      input,
    });

    expectSectionOrder(prompt);
    expect(prompt).toContain(`TASK\n\n${REFINEMENT_PROMPT_PRESET.task}`);
    expect(prompt).toContain(
      `META SPEC\n\n${REFINEMENT_PROMPT_PRESET.metaSpec}`,
    );
  });
});
