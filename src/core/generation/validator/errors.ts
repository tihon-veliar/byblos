// core/generation/validator/errors.ts

import {
  ParsedLlmOutputValidationError,
  ParsedLlmOutputValidationErrorCode,
} from './types'

type CreateErrorParams = {
  code: ParsedLlmOutputValidationErrorCode
  message: string
  noteIndex?: number
  metaKey?: string
}

export const createValidationError = (
  params: CreateErrorParams
): ParsedLlmOutputValidationError => {
  return params
}

export const noNotes = (): ParsedLlmOutputValidationError =>
  createValidationError({
    code: 'no_notes',
    message: 'No notes found in parsed output',
  })

export const emptyNote = (noteIndex: number): ParsedLlmOutputValidationError =>
  createValidationError({
    code: 'empty_note',
    message: 'Note is empty',
    noteIndex,
  })

export const missingRequiredMetaKey = (
  metaKey: string
): ParsedLlmOutputValidationError =>
  createValidationError({
    code: 'missing_required_meta_key',
    message: `Missing required meta key: ${metaKey}`,
    metaKey,
  })