# Byblos - Agent Rules

## Project
Byblos is an Obsidian plugin for epistemic Zettelkasten note generation and linking.

## Core Principle
Every note MUST include:
- epistemicMode
- claimStatus
- reviewStatus

## Scope Rules
- Do NOT modify code outside the requested task
- Do NOT introduce abstractions without explicit need
- Do NOT refactor unrelated parts
- Prefer minimal explicit changes

## Architecture Rules
- Strict separation: plugin / core / llm / indexing
- Plugin MUST NOT contain business logic
- Core MUST NOT depend on Obsidian API
- Core is the ONLY layer allowed to:
  - define schema
  - validate notes
  - enforce epistemic rules
- LLM layer MUST be replaceable
- Indexing MUST be independent of UI

## Note Discipline
- Every note MUST follow schema
- One note = one idea
- No unlabeled claims
- Each note MUST:
  - link to at least one other note OR
  - be explicitly marked as seed

## Epistemic Modes
- verified
- speculative
- fantasy
- audit

## Workflow
draft -> review -> committed

## Agents must NEVER
- create notes without required fields
- bypass schema validation
- mix responsibilities across layers
- call LLM outside LLM layer
- use Obsidian API outside plugin layer
- refactor outside task scope

## Current Stage
MVP - enforce structure, avoid feature expansion

## Design Ideas
- Store non-committed architecture and workflow ideas in `ideas/`
- Current expansion-mode concept lives in `ideas/iterative-expansion-mode.md`
- Treat documents in `ideas/` as optional proposals, not as default pipeline requirements
