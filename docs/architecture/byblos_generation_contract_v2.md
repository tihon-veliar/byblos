# Byblos — Generation Contract (Boundary)

## Purpose

Defines the boundary between Core and LLM during generation.

This document does NOT define:
- note schema
- prompt wording
- parser implementation
- provider-specific behavior

`note-schema.md` remains the single source of truth for note structure.

---

## Role in System

Generation is an execution boundary.

Core:
- prepares structured input
- invokes LLM through LLM layer
- validates returned output against schema
- rejects invalid output

LLM layer:
- executes prompt
- returns raw structured output
- does not validate
- does not persist
- does not mutate notes

Plugin:
- triggers generation flow
- displays result
- persists only accepted, validated output

Indexing:
- provides retrieval context
- does not repair invalid output
- does not define generation rules

---

## Scope

This contract applies to:
- generation input passed from Core
- raw output returned from LLM layer
- responsibility boundaries
- rejection flow

This contract does NOT apply to:
- note field definitions
- enum definitions
- schema rules already defined elsewhere

---

## Generation Input

Core MUST send explicit structured input.

## Input Shape

```ts
type GenerationInput = {
  mode: EpistemicMode
  generationStrategy: GenerationStrategy
  baseNote?: Note
  relatedNotes: Note[]
  userInput?: string
}
```

## Allowed GenerationStrategy

- expand
- contrast
- synthesize
- question
- refine

## Input Rules

- input is the only allowed generation context
- generation must not assume hidden context
- `mode` constrains epistemic framing
- `generationStrategy` constrains transformation intent
- `baseNote` is optional
- `relatedNotes` must be explicit and bounded

---

## Output Boundary

LLM layer returns raw structured note candidate data to Core.

The returned candidate MUST be intended to map to `note-schema.md`.

This contract does NOT restate the schema.
Core validation decides whether the mapping is valid.

---

## Acceptance Rule

A generation result is acceptable only if Core can validate it against `note-schema.md` without silent repair.

---

## Rejection Rule

Core MUST reject output if:

- it cannot be mapped to schema
- required structure is missing
- values are invalid
- output is malformed
- output contains multiple ideas in one note candidate
- output would require silent coercion to become valid

---

## Validation Responsibility

Core is the only validation authority in the generation flow.

Core MUST:
- validate every candidate
- reject invalid output
- prevent invalid persistence

LLM layer MUST NOT:
- define schema rules
- self-certify validity
- silently fix invalid structure

Plugin MUST NOT:
- validate note structure
- bypass Core validation

Indexing MUST NOT:
- repair malformed generated notes

---

## Minimal Flow

1. Plugin triggers generation request
2. Core builds `GenerationInput`
3. Core calls LLM layer
4. LLM layer returns raw candidate output
5. Core validates against `note-schema.md`
6. Core rejects or accepts result
7. Only accepted output may proceed further

---

## Implementation Rules

Code agents implementing generation MUST:

- keep business rules in Core
- keep provider-specific logic in LLM layer
- treat LLM output as untrusted
- avoid duplicating schema definitions
- use explicit transformations between raw output and validated note objects

Code agents MUST NOT:

- persist directly from LLM layer
- bypass validation
- duplicate schema enums in multiple layers
- auto-repair invalid output silently

---

## Final Position

This document defines the generation boundary, not the note model.

- `note-schema.md` defines what a valid note is
- this document defines how generation hands candidates to validation
