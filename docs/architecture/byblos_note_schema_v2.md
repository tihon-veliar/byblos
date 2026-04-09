# Note Schema (Updated Review)

## Definition
A note is valid only if all required fields exist and rules pass.

---

## Required Fields

- id: string
- title: string
- type: NoteType
- epistemicMode: EpistemicMode
- claimStatus: ClaimStatus
- reviewStatus: ReviewStatus
- content: string
- claims: Claim[]
- links: Link[]

---

## Optional Fields

- derivedFrom: string[]
- confidence: number (0..1)
- noveltyScore: number (0..1)

---

## Enums

### EpistemicMode
- verified
- speculative
- fantasy
- audit

### ClaimStatus
- verified
- interpretive
- hypothetical
- fictional
- unresolved

### ReviewStatus
- draft
- review
- committed

### NoteType
- seed
- zettel
- question
- synthesis
- tension
- fact
- hypothesis
- myth

---

## Claim
- text: string
- claimStatus: ClaimStatus

---

## Link
- type: LinkType
- target: note id

### LinkType
- extends
- contradicts
- refines
- example_of
- analogous_to
- question_for
- depends_on

---

## Rules

- one note = one idea
- content must align with claims
- each claim must have claimStatus
- links must be typed

- note MUST:
  - have at least one link
  OR
  - be type = seed

---

## Invalid Conditions

- missing required field
- invalid enum
- malformed claims or links
- multiple ideas in one note
- no links and type != seed

---

## Important Clarification (Updated)

Schema does NOT:
- define pipeline behavior
- define generation strategy
- enforce decomposition logic

Schema ONLY defines:
→ what a valid note is

---

## Final Position

Schema is the single source of truth for note structure.
