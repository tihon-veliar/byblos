// core/generation/validator/types.ts

export type ParsedLlmOutputValidationErrorCode =
  | 'no_notes'
  | 'empty_note'
  | 'missing_required_meta_key'

export type ParsedLlmOutputValidationError = {
  code: ParsedLlmOutputValidationErrorCode
  message: string
  noteIndex?: number
  metaKey?: string
}

export type ValidateParsedLlmOutputResult =
  | { ok: true }
  | { ok: false; error: ParsedLlmOutputValidationError }