// src/modules/refinement/refinement-module.test.ts

import { beforeEach, describe, expect, it, vi } from "vitest";

import { RefinementModule } from "./RefinementModule";
import { buildPrompt } from "../../llm/prompts/build-prompt";
import { generateRawText } from "../../llm/infra/gateway";
import { parseLlmOutput } from "../../core/generation/parser/parse-llm-output";
import { validateParsedLlmOutput } from "../../core/generation/validator/validate-parsed-llm-output";
import {
  mapNodes,
  extractLinksFromNodes,
} from "../../core/generation/mapper/note-mapper";

vi.mock("../../llm/prompts/build-prompt", () => ({
  buildPrompt: vi.fn(),
}));

vi.mock("../../llm/infra/gateway", () => ({
  generateRawText: vi.fn(),
}));

vi.mock("../../core/generation/parser/parse-llm-output", () => ({
  parseLlmOutput: vi.fn(),
}));

vi.mock("../../core/generation/validator/validate-parsed-llm-output", () => ({
  validateParsedLlmOutput: vi.fn(),
}));

vi.mock("../../core/generation/mapper/note-mapper", () => ({
  mapNodes: vi.fn(),
  extractLinksFromNodes: vi.fn(),
}));

describe("RefinementModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds prompt, calls gateway, parses, validates and maps nodes/links", async () => {
    vi.mocked(buildPrompt).mockReturnValue("REFINEMENT PROMPT");
    vi.mocked(generateRawText).mockResolvedValue("RAW LLM OUTPUT");
    vi.mocked(parseLlmOutput).mockReturnValue({
      ok: true,
      value: {
        notes: ["# Note A\n\nAlpha", "# Note B\n\nBeta"],
        meta: {},
        rawNoteArea: "",
        rawMetaArea: "",
      },
    });
    vi.mocked(validateParsedLlmOutput).mockReturnValue({ ok: true });
    vi.mocked(mapNodes).mockReturnValue([
      {
        id: "refined-node-1",
        title: "Note A",
        content: "Alpha",
      },
      {
        id: "refined-node-2",
        title: "Note B",
        content: "Beta",
      },
    ]);
    vi.mocked(extractLinksFromNodes).mockReturnValue([
      {
        source: "Note A",
        target: "Note B",
        type: "extends",
      },
    ]);

    const result = await RefinementModule.refine({
      draft: {
        content: "# Draft\n\nSome draft",
        retrievalQueries: ["q1"],
        retrievalSeed: "seed",
      },
      context: {
        primary: {
          id: "primary-id",
          title: "Human Agency",
          content: "Agency and responsibility",
        },
        related: [],
      },
      matches: [],
    });

    expect(buildPrompt).toHaveBeenCalledWith({
      preset: expect.anything(),
      context: {
        primary: {
          id: "primary-id",
          title: "Human Agency",
          content: "Agency and responsibility",
        },
        related: [],
      },
      input: "# Draft\n\nSome draft",
    });

    expect(generateRawText).toHaveBeenCalledWith("REFINEMENT PROMPT");
    expect(parseLlmOutput).toHaveBeenCalledWith("RAW LLM OUTPUT");
    expect(validateParsedLlmOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: ["# Note A\n\nAlpha", "# Note B\n\nBeta"],
      }),
    );
    expect(mapNodes).toHaveBeenCalledWith([
      "# Note A\n\nAlpha",
      "# Note B\n\nBeta",
    ]);
    expect(extractLinksFromNodes).toHaveBeenCalledWith([
      {
        id: "refined-node-1",
        title: "Note A",
        content: "Alpha",
      },
      {
        id: "refined-node-2",
        title: "Note B",
        content: "Beta",
      },
    ]);

    expect(result).toEqual({
      nodes: [
        {
          id: "refined-node-1",
          title: "Note A",
          content: "Alpha",
        },
        {
          id: "refined-node-2",
          title: "Note B",
          content: "Beta",
        },
      ],
      links: [
        {
          source: "Note A",
          target: "Note B",
          type: "extends",
        },
      ],
      rawText: "RAW LLM OUTPUT",
    });
  });

  it("throws when parser fails", async () => {
    vi.mocked(buildPrompt).mockReturnValue("REFINEMENT PROMPT");
    vi.mocked(generateRawText).mockResolvedValue("RAW LLM OUTPUT");
    vi.mocked(parseLlmOutput).mockReturnValue({
      ok: false,
      error: {
        code: "missing_meta_marker",
        message: "Missing META",
      },
    });

    await expect(
      RefinementModule.refine({
        draft: {
          content: "# Draft\n\nSome draft",
          retrievalQueries: ["q1"],
          retrievalSeed: "seed",
        },
        context: {
          primary: undefined,
          related: [],
        },
        matches: [],
      }),
    ).rejects.toMatchObject({
      code: "llm_output_parse_failed",
      stage: "refinement",
    });
  });

  it("throws when validation fails", async () => {
    vi.mocked(buildPrompt).mockReturnValue("REFINEMENT PROMPT");
    vi.mocked(generateRawText).mockResolvedValue("RAW LLM OUTPUT");
    vi.mocked(parseLlmOutput).mockReturnValue({
      ok: true,
      value: {
        notes: ["# Note A\n\nAlpha"],
        meta: {},
        rawNoteArea: "",
        rawMetaArea: "",
      },
    });
    vi.mocked(validateParsedLlmOutput).mockReturnValue({
      ok: false,
      error: {
        code: "empty_note",
        message: "Note is empty",
      },
    });

    await expect(
      RefinementModule.refine({
        draft: {
          content: "# Draft\n\nSome draft",
          retrievalQueries: ["q1"],
          retrievalSeed: "seed",
        },
        context: {
          primary: undefined,
          related: [],
        },
        matches: [],
      }),
    ).rejects.toMatchObject({
      code: "llm_output_validation_failed",
      stage: "refinement",
    });
  });
});
