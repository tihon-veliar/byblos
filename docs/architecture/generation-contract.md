# Generation Contract

## Purpose

This document defines how the generation subsystem must be implemented inside Byblos.

It is a development contract for code agents and developers.
It does NOT define a concrete LLM prompt.

The generation subsystem MUST produce note candidates that can be validated against `note-schema.md`.

---

## Scope

This contract applies to:
- generation input preparation
- generation output handling
- validation flow
- rejection rules
- responsibility boundaries

This contract does NOT define:
- provider-specific prompts
- model-specific wording
- prompt templates
- few-shot examples

---

## Generation Input

The generation subsystem MUST accept structured input with the following fields:

- `baseNote` (optional)
- `relatedNotes` (array)
- `mode` (`epistemicMode`)
- `generationStrategy`

Allowed `generationStrategy` values:
- `expand`
- `contrast`
- `synthesize`
- `question`
- `refine`

### Input Rules

- Input MUST be treated as the only generation context
- Generation logic MUST NOT assume information outside the provided input
- Input fields MUST NOT be reinterpreted into different semantics
- `mode` MUST constrain the generated note
- `generationStrategy` MUST constrain the type of transformation being requested

---

## Expected Output

The generation subsystem MUST return a single structured note candidate.

The returned note candidate MUST be compatible with `note-schema.md`.

Required fields:
- `id`
- `title`
- `type`
- `epistemicMode`
- `claimStatus`
- `reviewStatus`
- `content`
- `claims`
- `links`

Optional fields:
- `derivedFrom`
- `confidence`
- `noveltyScore`

---

## Output Invariants

A generated note candidate is valid only if:

- all required fields are present
- all enum values match `note-schema.md`
- `claims` is a structured array
- `links` is a structured array
- each claim includes:
  - `text`
  - `claimStatus`
- each link includes:
  - `type`
  - `target`
- `content` expresses the same idea as the claims
- the note contains exactly one idea
- if `links` is empty, `type` MUST be `seed`

---

## Rejection Conditions

A generated note candidate MUST be rejected if:

- any required field is missing
- any enum value is invalid
- claims are malformed
- links are malformed
- multiple ideas are present
- `content` and `claims` do not align
- `links` is empty and `type != seed`
- extra fields appear outside schema
- output cannot be mapped to `note-schema.md`

---

## Validation Responsibility

The Core layer is responsible for validation.

Core MUST:
- validate every generated note candidate
- reject invalid output
- enforce `note-schema.md`
- prevent persistence of invalid notes

Plugin MUST NOT validate generated notes.
LLM layer MUST NOT define schema rules.
Indexing MUST NOT repair invalid generated notes.

---

## Implementation Rules

Code agents implementing generation logic MUST:

- keep generation logic outside the plugin layer
- treat generated output as untrusted until validated
- keep provider-specific logic isolated from core rules
- avoid schema duplication across layers when possible
- prefer explicit transformation and validation steps

Code agents MUST NOT:

- bypass Core validation
- persist generation output directly from the plugin layer
- implement note schema rules inside the LLM layer
- silently coerce invalid output into valid notes

---

## Minimal Flow

1. Plugin triggers generation request
2. Core builds structured generation input
3. LLM layer executes generation
4. LLM layer returns raw structured candidate
5. Core validates candidate against `note-schema.md`
6. Core rejects or accepts candidate
7. Accepted candidate may proceed to indexing and persistence

---

## Example: Valid Candidate

```json
{
  "id": "20260406-001",
  "title": "Initial epistemic seed",
  "type": "seed",
  "epistemicMode": "speculative",
  "claimStatus": "hypothetical",
  "reviewStatus": "draft",
  "content": "An initial idea proposed for later development.",
  "claims": [
    {
      "text": "This note captures a speculative starting idea.",
      "claimStatus": "hypothetical"
    }
  ],
  "links": []
}