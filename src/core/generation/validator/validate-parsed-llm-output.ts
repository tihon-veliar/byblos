// core/generation/validator/validate-parsed-llm-output.ts

import { ParsedLlmOutput } from '../parser/types'
import { ValidateParsedLlmOutputResult } from './types'
import {
  noNotes,
  emptyNote,
  missingRequiredMetaKey,
} from './errors'

type ValidateOptions = {
  requiredMetaKeys?: string[]
}

export const validateParsedLlmOutput = (
  parsed: ParsedLlmOutput,
  options?: ValidateOptions
): ValidateParsedLlmOutputResult => {
  const { notes, meta } = parsed

  // at least one note
  if (!notes || notes.length === 0) {
    return { ok: false, error: noNotes() }
  }

  // no empty notes
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]

    if (!note || note.trim().length === 0) {
      return { ok: false, error: emptyNote(i) }
    }
  }

  // required meta keys (stage-aware)
  if (options?.requiredMetaKeys?.length) {
    for (const key of options.requiredMetaKeys) {
      if (!(key in meta)) {
        return { ok: false, error: missingRequiredMetaKey(key) }
      }
    }
  }

  return { ok: true }
}