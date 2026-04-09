// core/generation/validator/validate-parsed-llm-output.test.ts

import { describe, expect, it } from "vitest";
import { validateParsedLlmOutput } from "./validate-parsed-llm-output";
import { ParsedLlmOutput } from "../parser/types";

describe("validateParsedLlmOutput", () => {
  it("passes valid parsed output without required meta keys", () => {
    const parsed: ParsedLlmOutput = {
      notes: ["# Title\n\nText"],
      meta: {},
      rawNoteArea: "# Title\n\nText",
      rawMetaArea: "",
    };

    const result = validateParsedLlmOutput(parsed);

    expect(result).toEqual({ ok: true });
  });

  it("passes valid parsed output with required meta keys present", () => {
    const parsed: ParsedLlmOutput = {
      notes: ["# Title\n\nText"],
      meta: {
        search_phrases: ["a", "b"],
        mode: "test",
      },
      rawNoteArea: "# Title\n\nText",
      rawMetaArea: "search_phrases = [...]",
    };

    const result = validateParsedLlmOutput(parsed, {
      requiredMetaKeys: ["search_phrases", "mode"],
    });

    expect(result).toEqual({ ok: true });
  });

  it("fails when notes array is empty", () => {
    const parsed: ParsedLlmOutput = {
      notes: [],
      meta: {},
      rawNoteArea: "",
      rawMetaArea: "",
    };

    const result = validateParsedLlmOutput(parsed);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe("no_notes");
  });

  it("fails when note is empty string", () => {
    const parsed: ParsedLlmOutput = {
      notes: [""],
      meta: {},
      rawNoteArea: "",
      rawMetaArea: "",
    };

    const result = validateParsedLlmOutput(parsed);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe("empty_note");
    expect(result.error.noteIndex).toBe(0);
  });

  it("fails when note contains only whitespace", () => {
    const parsed: ParsedLlmOutput = {
      notes: ["   \n\t  "],
      meta: {},
      rawNoteArea: "   \n\t  ",
      rawMetaArea: "",
    };

    const result = validateParsedLlmOutput(parsed);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe("empty_note");
    expect(result.error.noteIndex).toBe(0);
  });

  it("fails when one of multiple notes is empty", () => {
    const parsed: ParsedLlmOutput = {
      notes: ["# A\n\nText", "   ", "# C\n\nText"],
      meta: {},
      rawNoteArea: "",
      rawMetaArea: "",
    };

    const result = validateParsedLlmOutput(parsed);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe("empty_note");
    expect(result.error.noteIndex).toBe(1);
  });

  it("fails when required meta key is missing", () => {
    const parsed: ParsedLlmOutput = {
      notes: ["# Title\n\nText"],
      meta: {
        mode: "test",
      },
      rawNoteArea: "# Title\n\nText",
      rawMetaArea: "mode = test",
    };

    const result = validateParsedLlmOutput(parsed, {
      requiredMetaKeys: ["mode", "search_phrases"],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe("missing_required_meta_key");
    expect(result.error.metaKey).toBe("search_phrases");
  });

  it("passes when requiredMetaKeys is empty", () => {
    const parsed: ParsedLlmOutput = {
      notes: ["# Title\n\nText"],
      meta: {},
      rawNoteArea: "# Title\n\nText",
      rawMetaArea: "",
    };

    const result = validateParsedLlmOutput(parsed, {
      requiredMetaKeys: [],
    });

    expect(result).toEqual({ ok: true });
  });
});
