// core/generation/parser/errors.ts

import { LlmOutputParseError, LlmOutputParseErrorCode } from "./types";

type CreateErrorParams = {
  code: LlmOutputParseErrorCode;
  message: string;
  line?: number;
  context?: string;
};

export const createParseError = (
  params: CreateErrorParams,
): LlmOutputParseError => {
  return params;
};

// optional helpers (использовать только если реально упрощают код)

export const missingMetaMarker = (): LlmOutputParseError =>
  createParseError({
    code: "missing_meta_marker",
    message: "<<<META>>> marker not found",
  });

export const multipleMetaMarkers = (): LlmOutputParseError =>
  createParseError({
    code: "multiple_meta_markers",
    message: "Multiple <<<META>>> markers found",
  });

export const emptyNoteArea = (): LlmOutputParseError =>
  createParseError({
    code: "empty_note_area",
    message: "Note area is empty",
  });

export const emptyNoteSegment = (): LlmOutputParseError =>
  createParseError({
    code: "empty_note_segment",
    message: "Empty note segment detected",
  });

export const invalidMetaLine = (
  line?: number,
  context?: string,
): LlmOutputParseError =>
  createParseError({
    code: "invalid_meta_line",
    message: "Invalid meta line format",
    line,
    context,
  });

export const unclosedArray = (): LlmOutputParseError =>
  createParseError({
    code: "unclosed_array",
    message: "Unclosed array in META",
  });

export const invalidArrayItem = (
  line?: number,
  context?: string,
): LlmOutputParseError =>
  createParseError({
    code: "invalid_array_item",
    message: "Invalid array item format",
    line,
    context,
  });

export const nestedArrayNotAllowed = (): LlmOutputParseError =>
  createParseError({
    code: "nested_array_not_allowed",
    message: "Nested arrays are not allowed",
  });
