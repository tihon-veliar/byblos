# Byblos — Pipeline Specification (Current)

## Purpose
Defines the current stable pipeline used by the system.

This document reflects post–Sprint 1 architecture (draft-first model).

---

## Core Principles

- draft-first generation
- refinement produces final notes
- LLM generates, Core validates
- pipeline is structurally deterministic
- user confirms before commit

---

## Pipeline

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

## Steps

### Input
User provides a short idea.

### Normalize
Basic cleanup only.

### Search-1
Initial retrieval of relevant notes.

### Context Build
Small, bounded context (no global graph).

### Generation (Draft)
LLM produces:
- draft content
- retrieval queries

No final notes.

### Search-2
Uses draft queries to improve context.

### Refinement
LLM produces final notes.

- may produce multiple notes
- notes must be atomic
- links embedded in text

### Result Assembly
Returns:
- notes
- matches

No validation logic here.

### User Review
User accepts or rejects.

### Commit
On accept:
- persist notes
- never modify existing notes

---

## Key Decisions

- generation ≠ final output
- refinement is the main generation step
- duplicate is not a hard stop
- links are title-based and embedded in text

---

## Constraints

- no global context
- no embeddings (MVP)
- no auto-editing existing notes

---

## Final State

Pipeline supports:
- multi-step retrieval
- draft-driven refinement
- controlled note creation
