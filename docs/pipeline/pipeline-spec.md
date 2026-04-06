# Byblos — Pipeline Specification

## Purpose

This document defines the stable architectural contract of the Byblos pipeline.

It is intended for:
- implementation agents
- architecture discussions
- future sprint alignment

Focus:
- minimal stages
- predictable behavior
- clean boundaries
- extensibility without scope drift

---

## Goal

Pipeline transforms user input into a structured pipeline result that may contain:

- zero nodes (duplicate)
- one new node
- multiple new nodes
- optional typed links

Pipeline does NOT persist anything by itself.

---

## Scope Level

This specification defines:

- pipeline stages
- stage order
- decision semantics
- stop conditions
- output invariants
- module responsibilities

This specification does NOT define:

- provider-specific prompts
- UI behavior in detail
- persistence implementation
- concrete search algorithm
- concrete LLM provider integration
- exact internal file structure

---

## High-Level Flow

input
→ normalize
→ search-1
→ early duplicate gate
→ context build
→ generate
→ search-2
→ final duplicate gate
→ link proposal
→ assemble
→ output / review

Commit is outside the core pipeline.

---

## Core Principles

- retrieval happens before generation
- generation uses local context only
- second retrieval happens after generation
- duplicate detection can stop the pipeline early
- link proposal happens only after duplicate is ruled out
- multiple generated nodes must form a connected decomposition
- existing notes must never be auto-modified
- pipeline structure must be deterministic even if content is not

---

## Pipeline Decisions

Pipeline result uses the following decisions:

- `duplicate`
- `seed`
- `linked`
- `decompose`

### Decision semantics

`duplicate`
- system found a strong match
- no new node should be created
- final result contains no generated nodes

`seed`
- pipeline produced exactly one new node
- no external links were proposed

`linked`
- pipeline produced one or more new nodes
- at least one meaningful external link to an existing node exists

`decompose`
- pipeline produced multiple new nodes
- those nodes represent decomposition of one idea
- those nodes must be internally linked

These values describe the final shape of the pipeline result.

They are NOT user actions.

---

## Data Contract Level

For pipeline purposes, the system uses compact pipeline contracts.

Minimal entities:

- `Input`
- `Node`
- `Match`
- `Link`
- `PipelineResult`

Pipeline contracts are transient orchestration contracts.

They are NOT the same as the final persisted note schema.

---

## Stage Definitions

### 1. Input

User provides:
- word
- phrase
- short sentence

No semantic preprocessing assumptions.

---

### 2. Cheap Normalization

Non-LLM step.

Responsibilities:
- trim
- basic cleanup
- preserve meaning

Must NOT:
- reinterpret intent
- enrich meaning
- perform generation

Output:
- normalized input text

---

### 3. Initial Search (Search-1)

Search index using normalized input.

Returns:
- strong matches
- related matches
- or empty result

Purpose:
- detect possible duplicate early
- gather local context candidates

No LLM involved.

---

### 4. Early Duplicate Gate

System checks Search-1 results.

Rule:
- if at least one strong match exists, pipeline stops with `duplicate`

Effects:
- generation is skipped
- link proposal is skipped
- final result contains:
  - no generated nodes
  - detected matches
  - empty links
  - decision = `duplicate`

This is the first stop condition.

---

### 5. Context Construction

Build local context from Search-1 results.

Context may include:
- top match
- nearest neighbors
- limited related notes

Constraints:
- context must stay local
- context must be small and bounded
- no global graph injection

Recommended bound:
- 3–5 items max

Purpose:
- help generation stay relevant
- reduce drift
- avoid uncontrolled expansion

---

### 6. Generation

Generation receives:
- normalized input
- local context

Generation returns:
- one new node
  OR
- multiple new nodes
- internal links between new nodes if multiple nodes are returned

Rules:
- generated nodes must be atomic
- generated nodes must be short
- one node = one idea
- if multiple nodes are returned, they must represent decomposition of one idea
- multiple nodes must be connected
- disconnected node lists are invalid

Generation does NOT:
- validate schema
- decide final pipeline outcome
- mutate existing notes
- persist anything

---

### 7. Second Search (Search-2)

Search again using generated node data.

Search input may use:
- generated node title
- generated node content

Purpose:
- detect stronger duplicate evidence
- find candidate existing nodes for linking

This step exists because generated wording may expose a duplicate more clearly than the original input.

---

### 8. Final Duplicate Gate

System checks Search-2 results.

Rule:
- if a strong match is found here, pipeline ends with `duplicate`

Effects:
- generated nodes are discarded from final result
- link proposal is skipped
- final result contains:
  - no generated nodes
  - detected matches
  - empty or ignored links
  - decision = `duplicate`

This is the second and final duplicate stop condition.

If pipeline reaches link proposal, duplicate is already closed.

---

### 9. Link Proposal

This step runs only if duplicate was NOT detected.

Input:
- generated nodes
- candidate existing nodes from Search-2

Output:
- proposed external links

Rules:
- propose only meaningful typed relations
- prefer 1–2 strong links over many weak links
- avoid over-linking
- external links must target existing nodes
- internal links created during decomposition are not external links

Allowed core relation types for MVP:
- `extends`
- `refines`
- `contradicts`

---

### 10. Result Assembly

System assembles final `PipelineResult`.

It combines:
- generated nodes
- detected matches
- internal links
- external links
- final decision

Decision resolution rules:

1. if duplicate was detected at any duplicate gate:
   - decision = `duplicate`

2. else if multiple generated nodes exist:
   - decision = `decompose`

3. else if at least one external link exists:
   - decision = `linked`

4. else:
   - decision = `seed`

---

### 11. Output / Review

Pipeline returns raw structured output for inspection.

User may:
- accept
- reject

Review is outside pipeline decision semantics.

---

### 12. Commit

Commit is outside the core pipeline contract.

If accepted later:
- new note files may be created
- metadata may be written
- links may be persisted

Existing notes must not be auto-edited.

---

## Output Invariants

A valid pipeline result must satisfy:

- `duplicate` ⇒ `nodes.length === 0`
- `decompose` ⇒ `nodes.length > 1` and internal links exist
- `linked` ⇒ at least one external link targets an existing node
- `seed` ⇒ exactly one new node and no external links

Additional invariants:
- nodes are atomic
- nodes are short
- links are typed
- links are meaningful
- no disconnected multi-node output
- no automatic mutation of existing notes

---

## Failure Conditions

Pipeline result must be rejected if:

- generated nodes are not atomic
- generated output contains unrelated node lists
- multiple generated nodes are not linked
- duplicate was detected
- malformed structure appears
- stage boundaries are violated
- invalid data is passed across layers

---

## Responsibility Boundaries

### Core
Responsible for:
- orchestration
- duplicate detection
- decision logic
- validation
- result assembly

Core must NOT:
- depend on Obsidian API
- contain UI logic
- call provider logic directly without layer boundary

### LLM
Responsible for:
- prompt execution
- response normalization
- generation
- link proposal execution

LLM must NOT:
- enforce schema rules
- decide duplicate outcome
- mutate notes
- persist output

### Indexing
Responsible for:
- search
- retrieval
- link graph support

Indexing must NOT:
- call LLM
- modify note content
- contain UI logic

### Plugin
Responsible for:
- UI
- Obsidian integration
- file read/write

Plugin must NOT:
- contain business logic
- validate notes
- call LLM directly

---

## Validation Position

Pipeline contracts may remain compact during generation and orchestration.

However:
- generated output must be treated as untrusted
- schema validation belongs to Core
- invalid output must never be persisted

This specification allows a compact pipeline layer and a stricter persisted note layer.

---

## MVP Constraints

For MVP / Sprint 1:

- no embeddings
- no global graph context
- no real provider required
- no persistence inside pipeline
- no automatic editing of existing notes
- no uncontrolled node explosion
- no unnecessary abstractions

---

## Sprint 1 Implementation Notes

Sprint 1 should implement a deterministic pipeline skeleton with:

- pipeline orchestrator
- stubbed search
- stubbed generation
- stubbed link proposal
- step-by-step logging
- CLI execution
- test scenarios for:
  - duplicate
  - seed
  - decompose

---

## Testable Behavioral Cases

### Case 1 — Duplicate
- Search-1 returns strong match
- pipeline stops early
- result decision = `duplicate`

### Case 2 — Seed
- no strong duplicate
- generation returns one node
- no external links
- result decision = `seed`

### Case 3 — Linked
- no duplicate
- generation returns node(s)
- link proposal returns external link(s)
- result decision = `linked`

### Case 4 — Decompose
- no duplicate
- generation returns multiple connected nodes
- result decision = `decompose`

---

## Non-Goals

This spec does NOT require:

- final persistence design
- full UI review flow
- advanced search relevance
- embeddings
- graph reasoning over full vault
- provider-specific prompting details

---

## Change Policy

Changes to this spec should be made only if they improve one of the following:

- pipeline correctness
- structural integrity
- predictability
- boundary clarity

Do NOT change this spec to introduce:
- convenience abstractions without need
- cross-layer leakage
- scope expansion disguised as architecture