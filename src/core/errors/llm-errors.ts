// core/errors/llm-errors.ts

export type LlmErrorCode =
  | "llm_call_failed"
  | "llm_output_parse_failed"
  | "llm_output_validation_failed";

export type LlmStage = "generation" | "refinement";

export class LlmError extends Error {
  public readonly code: LlmErrorCode;
  public readonly stage: LlmStage;
  public readonly cause?: unknown;

  constructor(params: {
    code: LlmErrorCode;
    message: string;
    stage: LlmStage;
    cause?: unknown;
  }) {
    super(params.message);

    this.name = "LlmError";
    this.code = params.code;
    this.stage = params.stage;
    this.cause = params.cause;
  }
}

export const llmCallFailed = (stage: LlmStage, cause?: unknown) =>
  new LlmError({
    code: "llm_call_failed",
    message: "LLM call failed",
    stage,
    cause,
  });

export const llmParseFailed = (stage: LlmStage, cause?: unknown) =>
  new LlmError({
    code: "llm_output_parse_failed",
    message: "Failed to parse LLM output",
    stage,
    cause,
  });

export const llmValidationFailed = (stage: LlmStage, cause?: unknown) =>
  new LlmError({
    code: "llm_output_validation_failed",
    message: "LLM output validation failed",
    stage,
    cause,
  });
