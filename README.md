# Byblos

Byblos is an experimental Obsidian plugin for building an epistemic Zettelkasten: not a wiki, not a dumping ground for notes, but a disciplined graph of ideas.

The project treats notes as atomic meaning units. Each note should express one idea, carry explicit epistemic metadata, and live inside a network of relations rather than in isolation. The goal is not to let an LLM "write knowledge for you", but to use LLM output as raw material that is validated, structured, linked, and committed into a controlled note corpus.

## Philosophy

Byblos starts from a simple claim: useful thinking is not just accumulation of text, but explicit structure.

The system is built around a few core beliefs:

- One note = one idea.
- Every claim should have an epistemic label.
- Notes should evolve by adding new notes and links, not by silently rewriting old ones.
- Relations matter as much as content.
- Validation belongs to the system core, not to the UI and not to the LLM.

So Byblos is closer to a structured thinking graph than to a classic knowledge base.

## What Makes A Byblos Note

Every canonical note must include:

- `epistemicMode`
- `claimStatus`
- `reviewStatus`

Current epistemic modes:

- `verified`
- `speculative`
- `fantasy`
- `audit`

Workflow states:

- `draft`
- `review`
- `committed`

Discipline rules:

- each note must follow schema
- each note should represent one idea
- unlabeled claims are not allowed
- a note must either link to another note or be explicitly marked as a `seed`

## What The Plugin Is Responsible For

Byblos is intentionally split into strict layers:

- `plugin/`: Obsidian integration, commands, filesystem interaction
- `core/`: schema, validation, epistemic rules, commit logic, pipeline orchestration
- `llm/`: provider integration, prompts, generation/refinement calls
- `indexing/`: search, normalization, graph/index building

Important boundary: the plugin must not contain business logic, and the core must not depend on the Obsidian API.

## Current MVP Pipeline

The current stable flow is:

`input -> normalize -> search-1 -> context build -> generation (draft) -> search-2 -> refinement -> result assembly -> commit`

Design intent:

- the LLM generates candidates
- the core validates structure
- existing notes are not auto-edited
- indexing is rebuildable derived data

Current code status:

- the architecture and sandbox flows already reflect this layered model
- the plugin exposes Obsidian commands for generation and reindexing
- the review UX is still MVP-simple, so some docs describe the target model a bit ahead of the current UI

## Repository Layout

```text
src/
  core/        validation, pipeline, commit rules
  indexing/    retrieval, normalization, graph/index logic
  llm/         provider config, prompts, generation, refinement
  plugin/      Obsidian-specific integration
  sandbox/     local testing flows
docs/
  architecture/
  pipeline/
  project/
ideas/
  optional proposals, not default behavior
.sandbox-vault/
.sandbox-vault-llm/
```

## Running The Project

Install dependencies:

```bash
npm install
```

Build the plugin:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Obsidian Usage

The plugin manages its own area inside a vault:

- `Byblos/notes` for canonical notes
- `Byblos/.index` for rebuildable derived indexes

Available commands in Obsidian:

- `Byblos: Generate and Commit Notes`
- `Byblos: Rebuild Managed Index`

The plugin keeps managed notes separate from the rest of the vault and also checks for title collisions with unmanaged notes.

## Sandbox Mode

Sandbox mode is the safest way to understand how Byblos behaves before using it inside a real vault.

There are two sandbox variants in this repo.

### 1. Local Sandbox Without LLM

Command:

```bash
npm run sandbox -- "incident summary"
```

What it does:

- resets `.sandbox-vault/` by default
- seeds a tiny managed corpus
- builds indexes
- creates sandbox nodes
- commits canonical markdown notes
- rebuilds indexes again

Result files appear in:

- `.sandbox-vault/Byblos/notes`
- `.sandbox-vault/Byblos/.index`

Use `--keep` if you want to preserve the previous sandbox corpus:

```bash
npm run sandbox -- --keep "incident summary"
```

This is the best entry point if you want to inspect canonical note writing and index rebuilding without paying for or depending on an LLM call.

### 2. LLM Sandbox

Command:

```bash
npm run sandbox:llm -- "your idea here"
```

What it does:

- uses `.sandbox-vault-llm/`
- runs the actual pipeline orchestrator
- calls generation and refinement modules
- commits the produced notes into the sandbox vault
- rebuilds derived indexes

Required environment variables in `.env`:

```env
API_SECRET_KEY=your_api_key
LLM_MODEL=gpt-5-mini
SKIP_AI_CALL=false
```

Notes:

- `LLM_MODEL` falls back to `gpt-5-mini` if omitted
- if `SKIP_AI_CALL=true`, the LLM sandbox will refuse to run
- this mode is for realistic end-to-end testing of the current generation path

### 3. MVP Commit Sandbox

There is also:

```bash
npm run sandbox:mvp
```

This script is a smaller manual playground for commit/index behavior and internal experiments.

## How To Read Sandbox Output

After a sandbox run, inspect:

- markdown notes in `Byblos/notes`
- note index in `Byblos/.index/notes.index.json`
- graph index in `Byblos/.index/graph.index.json`
- build metadata in `Byblos/.index/build-meta.json`

This lets you verify:

- whether canonical frontmatter was written
- which wiki-links were detected
- which typed links were resolved
- how the managed graph changed after commit

## Canonical Note Shape

In the current MVP commit path, canonical notes are written as markdown with frontmatter similar to:

```md
---
id: note_...
type: zettel
epistemicMode: speculative
claimStatus: hypothetical
reviewStatus: committed
aliases: []
tags: []
links: []
createdAt: ...
committedAt: ...
---

# Title

Atomic note content.
```

This is important: the LLM does not directly persist notes. Persistence happens only after core-side transformation and commit logic.

## Design Constraints

Byblos deliberately avoids several things:

- no business logic in the plugin layer
- no Obsidian API usage in the core layer
- no silent schema bypass
- no direct LLM persistence
- no automatic editing of existing notes
- no feature expansion that breaks the MVP structure

## Documents Worth Reading Next

- `docs/project/byblos-project.md` for the conceptual overview
- `docs/architecture/architecture-overview.md` for boundaries
- `docs/architecture/byblos_note_schema_v2.md` for note validity rules
- `docs/architecture/byblos_generation_contract_v2.md` for the Core/LLM boundary
- `docs/pipeline/byblos_pipeline_spec_v2.md` for the current stable pipeline
- `ideas/iterative-expansion-mode.md` for a proposed future mode

## Current Status

This project is still in MVP stage.

That means the priority is:

- enforce structure
- protect boundaries
- validate notes
- keep the pipeline understandable

Not the priority:

- feature sprawl
- hidden automation
- over-abstraction

Byblos is trying to become a reliable system for structured idea growth, not just another LLM note generator.
