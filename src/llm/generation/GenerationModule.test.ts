// src/llm/generation/GenerationModule.test.ts

import { beforeEach, describe, expect, it, vi } from "vitest";

import { GenerationModule } from "./GenerationModule";
import { buildPrompt } from "../prompts/build-prompt";
import { generateRawText } from "../infra/gateway";
import { parseLlmOutput } from "../../core/generation/parser/parse-llm-output";
import { validateParsedLlmOutput } from "../../core/generation/validator/validate-parsed-llm-output";

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

describe("GenerationModule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds prompt, calls gateway, parses, validates and returns draft", async () => {
    vi.mocked(buildPrompt).mockReturnValue("GENERATION PROMPT");
    vi.mocked(generateRawText).mockResolvedValue("RAW LLM OUTPUT");
    vi.mocked(parseLlmOutput).mockReturnValue({
      ok: true,
      value: {
        notes: ["# Draft A\n\nAlpha", "# Draft B\n\nBeta"],
        meta: {
          search_phrases: ["query a", "query b"],
          retrieval_seed: "central idea",
        },
        rawNoteArea: "",
        rawMetaArea: "",
      },
    });
    vi.mocked(validateParsedLlmOutput).mockReturnValue({ ok: true });

    const result = await GenerationModule.generate({
      text: "Human vs animal",
      context: {
        primary: {
          id: "primary-id",
          title: "Human Agency",
          content: "Agency and responsibility",
        },
        related: [],
      },
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
      input: "Human vs animal",
    });

    expect(generateRawText).toHaveBeenCalledWith("GENERATION PROMPT");
    expect(parseLlmOutput).toHaveBeenCalledWith("RAW LLM OUTPUT");
    expect(validateParsedLlmOutput).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: ["# Draft A\n\nAlpha", "# Draft B\n\nBeta"],
      }),
      { requiredMetaKeys: ["search_phrases"] },
    );

    expect(result).toEqual({
      content: "# Draft A\n\nAlpha\n\n# Draft B\n\nBeta",
      retrievalQueries: ["query a", "query b"],
      retrievalSeed: "central idea",
    });
  });

  it("falls back to joined notes when retrieval_seed is missing", async () => {
    vi.mocked(buildPrompt).mockReturnValue("GENERATION PROMPT");
    vi.mocked(generateRawText).mockResolvedValue("RAW LLM OUTPUT");
    vi.mocked(parseLlmOutput).mockReturnValue({
      ok: true,
      value: {
        notes: ["# Draft A\n\nAlpha"],
        meta: {
          search_phrases: ["query a"],
        },
        rawNoteArea: "",
        rawMetaArea: "",
      },
    });
    vi.mocked(validateParsedLlmOutput).mockReturnValue({ ok: true });

    const result = await GenerationModule.generate({
      text: "Human vs animal",
      context: {
        primary: undefined,
        related: [],
      },
    });

    expect(result).toEqual({
      content: "# Draft A\n\nAlpha",
      retrievalQueries: ["query a"],
      retrievalSeed: "# Draft A\n\nAlpha",
    });
  });

  it("throws when parser fails", async () => {
    vi.mocked(buildPrompt).mockReturnValue("GENERATION PROMPT");
    vi.mocked(generateRawText).mockResolvedValue("RAW LLM OUTPUT");
    vi.mocked(parseLlmOutput).mockReturnValue({
      ok: false,
      error: {
        code: "missing_meta_marker",
        message: "Missing META",
      },
    });

    await expect(
      GenerationModule.generate({
        text: "Human vs animal",
        context: {
          primary: undefined,
          related: [],
        },
      }),
    ).rejects.toMatchObject({
      code: "llm_output_parse_failed",
      stage: "generation",
    });
  });

  it("throws when validation fails", async () => {
    vi.mocked(buildPrompt).mockReturnValue("GENERATION PROMPT");
    vi.mocked(generateRawText).mockResolvedValue("RAW LLM OUTPUT");
    vi.mocked(parseLlmOutput).mockReturnValue({
      ok: true,
      value: {
        notes: ["# Draft A\n\nAlpha"],
        meta: {},
        rawNoteArea: "",
        rawMetaArea: "",
      },
    });
    vi.mocked(validateParsedLlmOutput).mockReturnValue({
      ok: false,
      error: {
        code: "missing_required_meta_key",
        message: "Missing required meta key",
        metaKey: "search_phrases",
      },
    });

    await expect(
      GenerationModule.generate({
        text: "Human vs animal",
        context: {
          primary: undefined,
          related: [],
        },
      }),
    ).rejects.toMatchObject({
      code: "llm_output_validation_failed",
      stage: "generation",
    });
  });

  it("throws when search_phrases is not an array", async () => {
    vi.mocked(buildPrompt).mockReturnValue("GENERATION PROMPT");
    vi.mocked(generateRawText).mockResolvedValue("RAW LLM OUTPUT");
    vi.mocked(parseLlmOutput).mockReturnValue({
      ok: true,
      value: {
        notes: ["# Draft A\n\nAlpha"],
        meta: {
          search_phrases: "not-an-array",
        },
        rawNoteArea: "",
        rawMetaArea: "",
      },
    });
    vi.mocked(validateParsedLlmOutput).mockReturnValue({ ok: true });

    await expect(
      GenerationModule.generate({
        text: "Human vs animal",
        context: {
          primary: undefined,
          related: [],
        },
      }),
    ).rejects.toThrow(
      "GenerationModule: search_phrases must be a string array in META.",
    );
  });
});
