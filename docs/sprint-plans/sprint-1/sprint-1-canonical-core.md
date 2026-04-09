# Byblos — Sprint 1 Canonical Core

## Purpose

This document defines the final, stable result of Sprint 1.

It replaces all Sprint 1 planning and stage documents.

It contains:
- final pipeline model (draft-first)
- core responsibilities
- minimal contracts
- system rules

No history, no alternatives, no transitional decisions.

---

## Core Principles

- one note = one idea
- notes are immutable after creation
- evolution happens via new notes
- LLM generates, Core validates
- pipeline is deterministic in structure
- user is always in the loop

---

## Architecture Boundaries

### Plugin
- UI
- file read/write

Must NOT:
- contain business logic
- validate notes
- call LLM directly

---

### Core
- pipeline orchestration
- validation
- schema enforcement

Core is the only layer allowed to:
- validate notes
- enforce epistemic rules

---

### LLM
- executes prompts
- returns structured output

Must NOT:
- validate
- mutate notes
- contain business logic

---

### Indexing
- search
- retrieval

Must NOT:
- modify notes
- call LLM

---

## Pipeline Model (Draft-First)

input
→ normalize
→ search-1
→ context build
→ generation (draft)
→ search-2
→ refinement (final notes)
→ result assembly
→ user review
→ commit

---

## Step Definitions

### 1. Input
User provides:
- word / phrase / short idea

---

### 2. Normalize
- trim
- cleanup
- no semantic changes

---

### 3. Search-1
- initial retrieval
- returns strong / related matches

---

### 4. Context Builder
- builds bounded local context
- max small set of notes

---

### 5. Generation (Draft)

Output:
```ts
type GenerationDraft = {
  content: string
  retrievalQueries: string[]
}
```

Rules:
- no final notes
- no schema enforcement
- no decomposition decisions

---

### 6. Search-2
Uses:
- retrievalQueries

Goal:
- enrich context

---

### 7. Refinement (Final Notes)

LLM produces:
- one or multiple notes

Rules:
- LLM decides number of notes
- notes follow output contract
- links are inside text (wikilinks)

---

### 8. Result Assembly

Returns:
- notes
- matches
- links (metadata)

No:
- validation logic
- duplicate decisions

---

### 9. User Review

User:
- accepts or rejects result

---

### 10. Commit

If accepted:
- notes are persisted
- metadata written

Existing notes are never modified automatically.

---

## Key Decisions

### Draft-first generation
Generation does not produce nodes.
It produces draft + retrieval direction.

---

### Refinement is the main generation step
Final notes are produced only after second retrieval.

---

### LLM decides decomposition
Code does not split notes heuristically.

---

### Duplicate is not a hard stop
Duplicates are signals, not blockers.

---

### Linking model
- links are title-based
- links live in note text
- metadata links are secondary

---

## Output Expectations

- atomic notes
- short content
- meaningful links
- valid structure

---

## Constraints

- no global graph context
- no embeddings (MVP)
- no auto-editing of existing notes
- no uncontrolled generation

---

## Minimal Data Contracts

### Note (conceptual)
- title
- content
- links

Full validation defined in note-schema.md

---

## Final State

System supports:
- draft-first generation
- multi-step retrieval
- LLM-driven refinement
- user-controlled commit

This is the stable baseline for further development.
