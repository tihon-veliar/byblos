# Architecture Overview

## Structure
/src
/plugin
/core
/llm
/indexing

---

## Layers

### Plugin
Responsibilities:
- Obsidian integration
- UI
- file read/write

Must NOT:
- contain business logic
- validate notes
- call LLM directly

---

### Core
Responsibilities:
- note schema
- validation
- epistemic rules
- transformation logic

Core is the ONLY layer allowed to:
- define schema
- validate notes
- enforce epistemic rules

Must NOT:
- depend on Obsidian API
- contain UI logic
- access filesystem
- call LLM directly

---

### LLM
Responsibilities:
- prompt execution
- response normalization
- provider abstraction

Must NOT:
- contain business rules
- modify notes directly
- access filesystem

---

### Indexing
Responsibilities:
- link graph
- search
- retrieval

Must NOT:
- modify note content
- call LLM
- depend on UI

---

## Data Flow

1. Plugin receives user action
2. Plugin sends input to Core
3. Core prepares request
4. Core calls LLM layer (optional)
5. LLM returns structured output
6. Core validates output
7. Core sends result to Indexing
8. Plugin persists result

---

## Boundaries

- Plugin → Core: input/output only
- Core → LLM: structured request/response only
- Core → Indexing: structured data only
- No cross-layer calls

---

## Anti-Patterns

- Plugin calling LLM
- Core using Obsidian API
- LLM returning unstructured text
- Notes bypassing validation
- Shared mutable state across layers