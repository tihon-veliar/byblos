export type ParsedMetaValue = string | string[]

export type ParsedMeta = Record<string, ParsedMetaValue>

export type ParsedLlmOutput = {
  notes: string[]
  meta: ParsedMeta
  rawNoteArea: string
  rawMetaArea: string
}

export type LlmOutputParseErrorCode =
  | 'missing_meta_marker'
  | 'multiple_meta_markers'
  | 'empty_note_area'
  | 'empty_note_segment'
  | 'invalid_meta_line'
  | 'unclosed_array'
  | 'invalid_array_item'
  | 'nested_array_not_allowed'

export type LlmOutputParseError = {
  code: LlmOutputParseErrorCode
  message: string
  line?: number
  context?: string
}

export type ParseLlmOutputResult =
  | { ok: true; value: ParsedLlmOutput }
  | { ok: false; error: LlmOutputParseError }