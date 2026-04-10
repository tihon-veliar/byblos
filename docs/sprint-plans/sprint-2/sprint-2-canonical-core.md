# Byblos --- Sprint 2 Canonical Core (Final)

## Purpose

This document defines the post--Sprint 2 canonical state of the system.

It consolidates: - pipeline behavior - LLM integration - prompt
architecture - parsing & validation boundaries - error handling model

This is the single source of truth for Sprint 2.

------------------------------------------------------------------------

## Final Pipeline

input\
→ normalize\
→ search-1\
→ context build\
→ generation (LLM draft)\
→ search-2\
→ refinement (LLM final notes)\
→ parser\
→ validator\
→ mapper\
→ result assembly\
→ user review\
→ commit

------------------------------------------------------------------------

## Core Principles

-   draft-first generation
-   refinement produces final notes
-   LLM generates, Core validates
-   strict contracts over heuristics
-   no silent fixes

------------------------------------------------------------------------

## Prompt Layer

Single system: - build-prompt - compose-prompt - presets (generation /
refinement)

Rules: - no manual prompt construction in modules - no duplicated
builders - stage variation only via presets

------------------------------------------------------------------------

## OUTPUT FORMAT (Canonical)

\<\<
```{=html}
<NOTE>
```
> > # Title

Content with \[\[links\]\]

\<\<
```{=html}
<NOTE>
```

\<\<
```{=html}
<META>
```
> > search_phrases = \[ - ...\]

retrieval_seed = ... \<\<
```{=html}
<META>
```

Notes: - multiple notes allowed - notes separated by \<\<
```{=html}
<NOTE>
```
> > -   META block must be last

------------------------------------------------------------------------

## META SPEC

Rules: - exactly one META block - META must be last - key = value
format - arrays:

key = \[ - item\]

Fields:

search_phrases: - required - string\[\]

retrieval_seed: - optional - string

------------------------------------------------------------------------

## Parser

Location: core/generation/parser

Rules: - strict - deterministic - no recovery - no auto-fix - invalid
format → reject

------------------------------------------------------------------------

## Validator

Location: core/generation/validator

Rules: - enforce contract - no repair - accept or reject only

------------------------------------------------------------------------

## Mapper

Location: core/generation/mapper

Responsibilities: - notes → Node\[\] - wikilinks → Link\[\]

Rules: - linking is title-based - typed links temporary

------------------------------------------------------------------------

## Context Model

Match: - lightweight - no content

ContextItem: - includes content

ContextBuilder: - resolves content - builds GenerationContext

Rule: - modules do not manipulate context

------------------------------------------------------------------------

## Module Rules

Modules MUST: - build prompt via builder - call gateway - pass raw
output to parser - pass parsed output to validator

Modules MUST NOT: - build prompts manually - format context - parse
locally - validate partially

------------------------------------------------------------------------

## GenerationModule

-   uses generation preset
-   produces draft
-   outputs:
    -   content
    -   retrievalQueries (search_phrases)
    -   retrievalSeed (optional, fallback)

------------------------------------------------------------------------

## RefinementModule

-   uses refinement preset
-   produces final notes
-   outputs:
    -   nodes
    -   links
    -   rawText

------------------------------------------------------------------------

## Error Model

Location: core/errors/llm-errors.ts

Types: - llm_call_failed - llm_output_parse_failed -
llm_output_validation_failed

Rules: - error stops stage - pipeline stops - no partial results

------------------------------------------------------------------------

## Testing Strategy

Covered: - parser - validator - mapper - prompt layer - modules (with
mocks)

Not covered: - orchestrator - search - provider

------------------------------------------------------------------------

## Current State

System is: - deterministic - contract-driven - LLM-integrated

------------------------------------------------------------------------

## Next Phase

-   Search (v1)
-   ContextBuilder (real data)
-   real pipeline execution

------------------------------------------------------------------------

## Final Position

Sprint 2 establishes a strict, layered, contract-driven system.

All future work must preserve: - boundaries - contracts - stage
responsibilities
