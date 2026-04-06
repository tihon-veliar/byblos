# Note Schema

## Definition
A note is valid only if all required fields are present and all rules pass.

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

## EpistemicMode

- verified
- speculative
- fantasy
- audit

---

## ClaimStatus

- verified
- interpretive
- hypothetical
- fictional
- unresolved

---

## ReviewStatus

- draft
- review
- committed

---

## NoteType

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

Each claim MUST include:
- text: string
- claimStatus: ClaimStatus

---

## Link

Each link MUST include:
- type: LinkType
- target: note id

---

## LinkType

- extends
- contradicts
- refines
- example_of
- analogous_to
- question_for
- depends_on

---

## Rules

- One note = one idea
- All required fields MUST be present
- epistemicMode MUST be valid
- claimStatus MUST be valid
- reviewStatus MUST be valid
- Each claim MUST have claimStatus
- Links MUST be typed
- content is explanatory text
- claims are atomic assertions
- Each note MUST:
  - link to at least one other note OR
  - be type = seed

---

## Invalid Conditions

A note is INVALID if:
- any required field is missing
- epistemicMode is unknown
- claimStatus is unknown
- reviewStatus is unknown
- claims are missing or malformed
- claim without claimStatus
- link without type or target
- no links and type != seed
- multiple ideas in content

---

## Example

```yaml
id: 20260406-001
title: "LLMs produce probabilistic outputs"
type: zettel

epistemicMode: verified
claimStatus: verified
reviewStatus: draft

content: >
  LLMs generate outputs based on probability distributions.

claims:
  - text: "LLMs generate outputs probabilistically"
    claimStatus: verified

links:
  - type: extends
    target: 20260406-000

confidence: 0.8
noveltyScore: 0.4