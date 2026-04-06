````md
# Byblos — Sprint 1 Plan (Core Skeleton)

## Purpose

This sprint establishes the minimal working core of the Byblos system.

Goal:
- implement a deterministic, testable pipeline skeleton
- validate architecture decisions early
- decouple logic from Obsidian

This is NOT a feature sprint.
This is a structural foundation sprint.

---

## Sprint Goal

Achieve a working pipeline:

input → search → context → generate → search → assemble → output

Requirements:
- runs outside Obsidian
- fully traceable (logs)
- predictable structure
- no external dependencies required

---

## Scope

### INCLUDED

- pipeline orchestration
- data contracts (minimal)
- stub implementations (search, LLM)
- CLI runner
- test scenarios

---

### EXCLUDED

- Obsidian integration
- file persistence
- real LLM provider
- embeddings / advanced search
- UI
- performance optimization

---

## Architecture Constraints

- core must be framework-agnostic
- no Obsidian API usage
- LLM must be abstracted
- search must be abstracted
- pipeline must be testable via CLI

---

## Pipeline Definition

### Steps

1. Input
2. Cheap normalization
3. Initial search (stub)
4. Context construction
5. Generation (LLM stub)
6. Second search (stub)
7. Duplicate detection (basic)
8. Link proposal (stub or simple logic)
9. Result assembly
10. Output

Each step must be explicitly implemented as a separate function/module.

---

## Data Contracts (Minimal)

### Input

```json
{
  "text": "string"
}
````

---

### Node (Compact)

```json
{
  "id": "string",
  "title": "string",
  "content": "string"
}
```

---

### Match

```json
{
  "id": "string",
  "title": "string",
  "score": "number",
  "type": "strong | related"
}
```

---

### Link

```json
{
  "source": "nodeId",
  "target": "nodeId",
  "type": "extends | refines | contradicts"
}
```

---

### Pipeline Result

```json
{
  "nodes": [],
  "matches": [],
  "links": [],
  "decision": "duplicate | seed | linked | decompose"
}
```

---

## Components to Implement

### 1. Pipeline Orchestrator

* main entry point
* calls all steps in order
* logs each step

---

### 2. Search Module (Stub)

* input → returns mock matches
* must simulate:

  * strong match
  * related match
  * empty result

---

### 3. LLM Module (Stub)

* input → returns:

  * single node OR
  * multiple nodes (mini-subgraph)

Rules:

* multi-node output must include internal links

---

### 4. Context Builder

* takes search result
* selects:

  * top match
  * limited neighbors (stub)

---

### 5. Duplicate Detector

* simple rule:

  * if strong match exists → duplicate

---

### 6. Link Proposal

* simple heuristic or stub:

  * generate 1–2 links

---

### 7. Result Assembler

* combine:

  * generated nodes
  * matches
  * links
  * decision

---

### 8. CLI Runner

Example:

```bash
node run.js "LLM does not store meaning"
```

Output:

* structured result (JSON)
* step-by-step logs

---

## Test Scenarios

### Case 1 — New Idea (Seed)

* no matches
* result → new node

---

### Case 2 — Duplicate

* strong match present
* result → no new node

---

### Case 3 — Decomposition

* LLM returns 2 nodes
* nodes must be linked

---

## Logging Requirements

Each step must log:

* input
* output
* decision

Example:

```text
[Search] Found 1 strong match
[LLM] Generated 2 nodes
[Decision] Decompose
```

---

## Acceptance Criteria

* pipeline runs locally
* no dependency on Obsidian
* no dependency on real LLM
* deterministic structure of output
* clear separation of modules
* ability to swap stubs later

---

## Anti-Patterns

DO NOT:

* implement real LLM integration
* add unnecessary abstractions
* couple modules together
* introduce persistence
* overcomplicate search logic

---

## Deliverable

Working CLI-based pipeline with:

* stubbed modules
* structured output
* test cases

---

## Progress Tracking

### Completed

*

### In Progress

*

### Not Started

*

### Notes

*

### Next Step

*

```
```
