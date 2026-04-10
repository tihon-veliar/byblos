import { describe, expect, it } from "vitest";

import { buildPrompt } from "./build-prompt";
import { composePrompt } from "./compose-prompt";
import { GENERATION_PROMPT_PRESET } from "./presets/generation";
import { REFINEMENT_PROMPT_PRESET } from "./presets/refinement";
import { serializeGenerationContext } from "./serialize-context";

import type { GenerationContext } from "../../core/pipeline/contracts";

describe("serializeGenerationContext", () => {
  it("renders primary before related and preserves related order without rewriting items", () => {
    const context: GenerationContext = {
      primary: {
        id: "primary",
        title: " Primary idea ",
        content: " Primary content ",
      },
      related: [
        {
          id: "r-1",
          title: " First related ",
          content: " First content ",
        },
        {
          id: "r-2",
          title: " Second related ",
          content: " Second content ",
        },
      ],
    };

    expect(serializeGenerationContext(context)).toBe(
      [
        "PRIMARY:",
        "",
        "# Primary idea",
        "",
        "Primary content",
        "",
        "RELATED:",
        "",
        "# First related",
        "",
        "First content",
        "",
        "# Second related",
        "",
        "Second content",
      ].join("\n"),
    );
  });

  it("handles missing primary by serializing only related items", () => {
    const context: GenerationContext = {
      related: [
        {
          id: "r-1",
          title: "Related note",
          content: "Related content",
        },
      ],
    };

    expect(serializeGenerationContext(context)).toBe(
      ["RELATED:", "", "# Related note", "", "Related content"].join("\n"),
    );
  });

  it("handles empty related items by serializing only primary", () => {
    const context: GenerationContext = {
      primary: {
        id: "primary",
        title: "Primary note",
        content: "Primary content",
      },
      related: [],
    };

    expect(serializeGenerationContext(context)).toBe(
      ["PRIMARY:", "", "# Primary note", "", "Primary content"].join("\n"),
    );
  });

  it("returns an empty string when both primary and related are empty", () => {
    const context: GenerationContext = {
      related: [],
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

  it("keeps empty section content predictable instead of dropping the section", () => {
    const prompt = composePrompt([
      { title: "FIRST", content: "" },
      { title: "SECOND", content: "two" },
    ]);

    expect(prompt).toBe(
      ["FIRST", "", "---", "", "SECOND", "", "two"].join("\n"),
    );
  });
});

describe("buildPrompt", () => {
  const context: GenerationContext = {
    primary: {
      id: "primary",
      title: "Main context",
      content: "Main context body",
    },
    related: [
      {
        id: "related-1",
        title: "Related context",
        content: "Related context body",
      },
    ],
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
      context,
      input,
    });

    expectSectionOrder(prompt);
    expect(prompt).toContain(`TASK\n\n${REFINEMENT_PROMPT_PRESET.task}`);
    expect(prompt).toContain(
      `META SPEC\n\n${REFINEMENT_PROMPT_PRESET.metaSpec}`,
    );
    expect(prompt).toContain(
      `CONTEXT\n\n${serializeGenerationContext(context)}`,
    );
    expect(prompt).toContain(`INPUT\n\n${input}`);
  });

  it("does not reorder preset content across TASK and META SPEC sections", () => {
    const prompt = buildPrompt({
      preset: REFINEMENT_PROMPT_PRESET,
      context,
      input,
    });

    const taskIndex = prompt.indexOf(
      `TASK\n\n${REFINEMENT_PROMPT_PRESET.task}`,
    );
    const metaSpecIndex = prompt.indexOf(
      `META SPEC\n\n${REFINEMENT_PROMPT_PRESET.metaSpec}`,
    );
    const contextIndex = prompt.indexOf(
      `CONTEXT\n\n${serializeGenerationContext(context)}`,
    );

    expect(taskIndex).toBeGreaterThan(-1);
    expect(metaSpecIndex).toBeGreaterThan(taskIndex);
    expect(contextIndex).toBeGreaterThan(metaSpecIndex);
  });
});
