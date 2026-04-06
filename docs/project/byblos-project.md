# Byblos — Project Overview

## Purpose

Byblos is an experimental system for extracting and structuring meaning from LLM latent space.

It does not aim to produce truth or a knowledge base.
It aims to construct a graph of ideas, relations, and contradictions derived from LLM reasoning.

---

## Core Concept

- LLM contains compressed representations of human knowledge
- Byblos extracts local meaning units ("nodes")
- Nodes are connected into a graph
- The graph reflects:
  - ideas
  - relations
  - contradictions
  - evolution of thought

This is not a wiki.
This is a **structured thinking graph**.

---

## Node Model

### Node = atomic idea

Rules:
- one node = one idea
- short (1–3 sentences)
- self-contained
- no long-form writing

---

## Immutability

- existing nodes MUST NOT be modified automatically
- LLM cannot edit existing nodes
- changes are expressed via:
  - new nodes
  - links (refines / extends / contradicts)

User may edit manually.

---

## No Duplicate Titles

- node titles must be unique
- if similar idea exists → refine or extend instead
- evolution happens through new nodes:
  - "Concept"
  - "Concept 2.0"
  - "Concept as process"

---

## Links

Links are semantic, not decorative.

Allowed types:
- extends
- refines
- contradicts

Rules:
- links must express meaning
- each new node should have at least one link if possible
- max 1–2 links per node (MVP guideline)

---

## Generation Model

### Input

User provides:
- word / phrase / short idea

---

### Generation Behavior

LLM:
- generates either:
  - a single node
  - or multiple nodes (mini-subgraph)

Rules:
- multiple nodes MUST represent decomposition of one idea
- nodes MUST be linked to each other

---

### Decomposition

If idea is complex:
- LLM generates 2–N nodes
- nodes are connected
- represent structure of idea

---

## Pipeline (MVP)

1. user input
2. search (cheap lexical)
3. context building (top match + neighborhood)
4. LLM generation:
   - 1 or N nodes
   - proposed links
5. duplicate detection
6. second search (based on generated nodes)
7. link proposal refinement
8. user review (raw)
9. commit

---

## Decision Outcomes

System may result in:

- duplicate → reject creation
- create seed → no links
- create linked node → with relations
- decompose → multiple nodes

---

## Search Strategy

MVP:
- lexical / fuzzy search
- no embeddings initially

Context:
- top match
- nearest neighbors
- limited set only

---

## Context Principle

LLM receives:
- local context only
- not entire graph

Goal:
- minimize noise
- preserve reasoning quality

---

## Storage Model

### Canonical storage

- markdown files (Obsidian vault)
- each node = file

---

### Index (non-canonical)

- JSON-based
- rebuildable
- used for:
  - search
  - retrieval
  - graph navigation

---

## Architecture

Layers:

- core → logic, pipeline, decisions
- llm → model interaction only
- search → retrieval and filtering
- plugin → Obsidian integration
- index → derived data

Core must be independent of Obsidian.

---

## LLM Role

LLM is responsible for:
- idea generation
- decomposition
- relation proposal

LLM is NOT responsible for:
- validation
- persistence
- schema enforcement

---

## Validation

Core must:
- validate generated nodes
- reject invalid outputs
- enforce schema

---

## UX (MVP)

User sees raw output:

- proposed nodes
- found matches
- suggested links

User can:
- accept
- reject

Modes (future):
- manual
- assisted
- auto

---

## Constraints

- no long notes
- no auto-editing of old nodes
- no duplicate titles
- no global context injection
- no over-linking

---

## Project Philosophy

- structure over content
- relations over accumulation
- evolution over correction
- locality over global reasoning

---

## Next Step

Implement core pipeline skeleton independent of Obsidian.