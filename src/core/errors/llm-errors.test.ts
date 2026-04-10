import { describe, expect, it } from "vitest";
import {
  LlmError,
  llmCallFailed,
  llmParseFailed,
  llmValidationFailed,
} from "./llm-errors";

describe("llm-errors", () => {
  it("llmCallFailed creates LlmError with correct code and stage", () => {
    const cause = new Error("network");
    const error = llmCallFailed("generation", cause);

    expect(error).toBeInstanceOf(LlmError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("LlmError");
    expect(error.code).toBe("llm_call_failed");
    expect(error.stage).toBe("generation");
    expect(error.cause).toBe(cause);
    expect(error.message).toBe("LLM call failed");
  });

  it("llmParseFailed creates parse error", () => {
    const cause = { code: "missing_meta_marker" };
    const error = llmParseFailed("refinement", cause);

    expect(error.code).toBe("llm_output_parse_failed");
    expect(error.stage).toBe("refinement");
    expect(error.cause).toBe(cause);
    expect(error.message).toBe("Failed to parse LLM output");
  });

  it("llmValidationFailed creates validation error", () => {
    const cause = { code: "missing_required_meta_key" };
    const error = llmValidationFailed("generation", cause);

    expect(error.code).toBe("llm_output_validation_failed");
    expect(error.stage).toBe("generation");
    expect(error.cause).toBe(cause);
    expect(error.message).toBe("LLM output validation failed");
  });
});
