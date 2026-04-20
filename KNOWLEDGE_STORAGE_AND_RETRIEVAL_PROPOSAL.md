# KNOWLEDGE_STORAGE_AND_RETRIEVAL_PROPOSAL

## 1. Executive Summary

Byblos already has a clear architectural direction in the docs: markdown notes are the canonical storage layer, indexes are derived and rebuildable, retrieval must stay bounded and explainable, and the LLM must only receive a small local slice of knowledge rather than the full graph. The repository, however, is still earlier than that target. The current runtime pipeline has prompt, parser, and draft/refinement stages, but storage, indexing, retrieval, and context assembly are mostly placeholders.

The strongest repository-grounded recommendation is:

- keep canonical note truth in markdown files
- keep one note per file
- make filenames title-based, not id-only
- assign persistent ids only at commit time
- treat wikilinks in note text as the primary semantic link layer
- keep typed links as canonical structured metadata written at commit, but secondary to text
- build a small rebuildable lexical index from markdown plus frontmatter
- use deterministic title-weighted lexical retrieval first
- let graph signals only refine or expand a small selected set, never drive open-ended prompt context
- give `ContextBuilder` explicit stage-aware rules and a transparent selection trace

This preserves the existing Byblos principles while avoiding premature complexity such as embeddings, opaque scoring, or graph-wide prompt injection.

## 2. Current Repository Findings

### Confirmed in code

- The stable runtime pipeline shape already exists in code as `normalize -> search-1 -> context build -> generation -> search-2 -> refinement -> link proposal -> result assembly` in `src/core/pipeline/PipelineOrchestrator.ts`.
- `SearchModule` is currently a hard-coded mock over three entries, with no file-backed indexing or persistence integration yet, in `src/indexing/search/SearchModule.ts`.
- `ContextBuilder` currently picks one `strong` match as `primary`, then up to four more matches as `related`, but fills note content with placeholder strings instead of reading real notes, in `src/core/pipeline/ContextBuilder.ts`.
- Prompt construction is centralized and deterministic. Both generation and refinement use the same builder with stage presets in `src/llm/prompts`.
- LLM output is strict markdown note text plus a final `<<<META>>>` block. The parser is deterministic and rejects malformed structure in `src/core/generation/parser`.
- The mapper currently extracts note titles from H1 headings and extracts wikilinks from body text. It converts all extracted links to temporary `"extends"` links in `src/core/generation/mapper/note-mapper.ts`.
- The runtime `Node` shape in `src/core/pipeline/contracts.ts` only contains `id`, `title`, and `content`. It does not yet match the full documented note schema.
- The plugin currently has one direct Obsidian command that creates a markdown file immediately in the vault using a timestamp id as filename and frontmatter template fields in `src/main.ts`.
- `src/indexing/types.ts` sketches an `IndexedNote` with `path`, `title`, `aliases`, `tags`, token fields, and link fields, which is the closest thing in code to a future index contract.

### Confirmed in docs

- The architecture docs fix the layer split: `plugin / core / llm / indexing`, and explicitly forbid business logic in plugin, Obsidian dependencies in core, and retrieval logic in LLM prompts. See `docs/architecture/architecture-overview.md`.
- The pipeline spec fixes the target pipeline shape as `input -> normalize -> search-1 -> context build -> generation (draft) -> search-2 -> refinement -> parser -> validator -> mapper -> result assembly -> user review -> commit`. See `docs/pipeline/byblos_pipeline_spec_v2.md` and `docs/sprint-plans/sprint-2/sprint-2-canonical-core.md`.
- The project docs say canonical storage should be markdown files in an Obsidian vault, with JSON indexes as non-canonical rebuildable structures. See `docs/project/byblos-project.md`.
- The docs consistently state that links are title-based and embedded in text, and that typed links are secondary metadata. See `docs/pipeline/byblos_pipeline_spec_v2.md` and `docs/sprint-plans/sprint-1/sprint-1-canonical-core.md`.
- The docs explicitly reject global context injection, embeddings in MVP, and auto-editing existing notes.
- The note schema doc defines a much richer canonical note object with `id`, `title`, `type`, `epistemicMode`, `claimStatus`, `reviewStatus`, `content`, `claims`, and `links`. See `docs/architecture/byblos_note_schema_v2.md`.

### Missing or still placeholder

- No real markdown note repository abstraction exists yet.
- No commit-stage note writer exists for validated pipeline output.
- No real index build flow exists from vault markdown to derived search/graph data.
- No content resolver exists for `ContextBuilder`.
- No contract yet exists for storage-path policy, note filename policy, title uniqueness enforcement, or markdown-to-index rebuild flow.
- No retrieval result contract exists beyond `Match[]`.
- No explicit context-selection trace exists, so the system cannot yet explain why a note entered prompt context.
- No real duplicate detection is implemented even though `DuplicateDetector.ts` exists.

### Important contradictions

- The documented schema requires typed links and several epistemic fields, but the runtime refinement output currently maps only to `{ id, title, content }` plus temporary `"extends"` links.
- The docs say canonical storage should be markdown notes, but the current plugin command writes id-based filenames and a template note directly, without the draft/refinement/validation pipeline.
- The schema says `Link.target` is a note id, while the broader project direction and current mapper behavior are title-first and wikilink-first.
- The LLM prompt rules explicitly forbid frontmatter in generated notes, so canonical on-disk markdown cannot be written directly from raw LLM note text. A commit-stage mapping step is required.

## 3. Architectural Constraints Already Fixed in Byblos

The following should be treated as fixed constraints, because they are repeated across docs and partially reflected in code:

- markdown notes are canonical; indexes are derived
- one note = one idea
- notes are short and atomic
- existing notes are not auto-edited
- pipeline is draft-first, then retrieval-enriched refinement
- LLM output is untrusted
- Core validates; LLM does not
- textual wikilinks are the primary semantic link layer
- typed links are secondary structure, not the first-class semantic source
- retrieval must stay bounded, local, and explainable
- the graph must not be injected wholesale into prompts
- persistence identifiers should not drive earlier generation logic

These constraints imply that the storage design, index design, and context design must all optimize for locality, deterministic behavior, and inspectability rather than for maximal recall.

## 4. Proposed Note File System

### Canonical on-disk rule

The canonical persisted artifact should be one markdown file per committed note.

### Directory strategy

For MVP, use one dedicated managed root for Byblos notes and keep the corpus flat inside it:

```text
<vault>/Byblos/
  notes/
    human-agency.md
    responsibility.md
  .index/
    notes.index.json
    graph.index.json
    build-meta.json
```

Why flat:

- Byblos retrieval is title-centric, not folder-centric
- semantic folders would create a second classification system too early
- type-based folders would be brittle because note type is epistemic metadata, not storage identity
- date-based folders hurt human browsing, link readability, and title-first linking
- flat storage stays closest to Obsidian’s native wikilink model

What to postpone:

- semantic subfolders
- type folders
- date partitions
- sharded storage

If the corpus later grows enough that a fully flat folder becomes operationally annoying, the first acceptable evolution is mechanical sharding that does not carry meaning, for example `notes/a/agency.md`. That should be postponed until scale actually requires it.

### File naming

Use filename = normalized title slug, not filename = persistent id.

Recommended rule:

- human-visible title remains the semantic identity
- file path is derived from title
- persistent id is assigned at commit and stored in frontmatter

Why:

- Byblos already treats links as title-based and embedded in markdown text
- the docs require unique titles
- id-only filenames would make the Obsidian layer less legible and less aligned with the semantic graph
- new notes do not need ids during generation and refinement

Recommended normalization:

- lowercase slug
- spaces to `-`
- strip filesystem-illegal characters
- keep output stable and deterministic

Collision policy:

- duplicate title should be treated as a retrieval/validation concern before commit
- do not silently suffix filenames as a normal path
- only use a suffix fallback for true manual conflict cases, and surface it explicitly

### Relationship between path, id, title, and links

- `title` is the semantic identity used in note text and wikilinks
- `path` is a persistence convenience derived from title
- `id` is a stable storage identifier assigned only at commit
- `wikilinks` point by title
- `typed links` can be resolved to ids at commit, but must stay semantically consistent with the title-layer links

That means title drives retrieval and human navigation, while id exists for stable storage bookkeeping and future safe renames if needed.

## 5. Proposed Canonical Markdown Structure

The repository already implies a two-stage representation:

- LLM outputs body markdown without frontmatter
- commit layer writes canonical markdown with frontmatter plus note body

That split should become explicit.

### Recommended canonical note file

```md
---
id: note_20260420_8f3c2a
type: zettel
epistemicMode: speculative
claimStatus: hypothetical
reviewStatus: committed
aliases: []
tags: []
derivedFrom: []
confidence: 0.3
noveltyScore: 0.5
links:
  - type: extends
    targetId: note_20260418_b12ae1
createdAt: 2026-04-20T12:34:56.000Z
committedAt: 2026-04-20T12:35:20.000Z
---

# Human Agency

Agency is the capacity to act for reasons and remains connected to [[Responsibility]].
```

### What should be canonical where

Canonical in body:

- H1 title
- note prose
- inline wikilinks

Canonical in frontmatter:

- persistent id
- note type
- epistemic fields
- commit-state fields
- optional aliases/tags
- typed links
- timestamps
- optional confidence/novelty if Core approves those fields

Derived in index:

- tokenized title/content/aliases/tags
- outgoing wikilink targets
- incoming link map
- title normalization map
- searchable excerpts
- ranking support fields

Runtime-only:

- retrieval scores
- match reasons
- context inclusion reasons
- stage-specific prompt payloads

### Title handling

To avoid split truth, the canonical title should be the H1 heading and must match the filename stem. Runtime `Note.title` can be read from that heading. Frontmatter should not also become an independent title authority unless the schema is revised to require it on disk.

### Typed links policy

Because the docs treat textual links as primary and the schema requires typed links, the safest MVP rule is:

- body wikilinks are the primary semantic relation layer
- frontmatter `links` is the canonical structured mirror used for validation and indexing
- commit must reject a typed link that cannot be reconciled with a corresponding body wikilink

This preserves both the documented schema and the title-first philosophy.

### Claims field

The schema doc requires `claims: Claim[]`, but neither runtime code nor LLM output currently models claims explicitly. Until that contract is implemented end-to-end, the proposal should treat this as a known schema gap:

- do not invent a storage-only `claims` structure inside indexing
- either add claims to canonical frontmatter later through Core mapping
- or explicitly revise the schema if claims are no longer required

For this proposal, retrieval should not depend on `claims` existing.

## 6. Proposed Indexing Model

### Principle

Indexes must be derived from markdown files and rebuildable from disk at any time.

### Minimum MVP indexes

#### 1. Note catalog index

Purpose:

- one row per note
- supports lexical retrieval
- supports note resolution by title, id, and path

Recommended entry:

```ts
type IndexedNote = {
  id: string
  path: string
  title: string
  normalizedTitle: string
  aliases: string[]
  tags: string[]
  type?: string
  epistemicMode?: string
  claimStatus?: string
  reviewStatus?: string
  content: string
  titleTokens: string[]
  contentTokens: string[]
  aliasTokens: string[]
  tagTokens: string[]
  outgoingWikiLinks: string[]
  outgoingTypedLinks: { type: string; targetId: string }[]
}
```

#### 2. Title resolution index

Purpose:

- resolve title and alias lookups deterministically
- support wikilink resolution during indexing and retrieval

Recommended structure:

```ts
type TitleLookup = {
  byNormalizedTitle: Record<string, string>
  byAlias: Record<string, string[]>
}
```

#### 3. Link graph index

Purpose:

- lightweight one-hop graph lookup
- supports incoming/outgoing neighbor retrieval

Recommended structure:

```ts
type LinkGraphIndex = {
  outgoingById: Record<string, string[]>
  incomingById: Record<string, string[]>
}
```

#### 4. Build metadata

Purpose:

- detect stale index state
- support rebuild diagnostics

Recommended structure:

```ts
type BuildMeta = {
  version: 1
  builtAt: string
  noteCount: number
}
```

### Rebuild policy

For MVP:

- rebuild whole index on plugin startup
- rebuild after commit
- allow full rebuild command for recovery

Do not build:

- partial incremental invalidation logic
- background compaction
- distributed index persistence

### Persistent vs rebuildable

Persist to disk:

- note catalog index
- link graph index
- build metadata

Treat as rebuildable and non-authoritative:

- all scores
- token lists
- incoming link tables
- search caches

## 7. Proposed Retrieval Strategy (MVP)

### Retrieval baseline

MVP should be deterministic title-weighted lexical retrieval with small graph-aware expansion only after initial ranking.

This means:

- no embeddings
- no vector database
- no opaque semantic ranker
- no graph traversal before lexical anchors are found

### Searchable fields

Ranked fields:

- title
- aliases
- body content
- outgoing wikilink targets
- tags

Filter-only fields:

- type
- epistemicMode
- claimStatus
- reviewStatus

### Ranking signals worth keeping in MVP

Use explicit weighted signals:

- exact normalized title match: strongest
- near title token overlap: very strong
- alias exact match: strong
- title token subset match: strong
- content token overlap: medium
- wikilink target token overlap: weak support only
- tag overlap: weak support only

Suggested ranking rule:

1. detect exact title or alias hits first
2. score lexical overlap on title and body
3. use link-target and tag overlap only as tie-breakers
4. bucket results into `strong` and `related` using deterministic thresholds

### Strong vs related

`strong` should mean one of:

- exact or near-exact title match
- high lexical overlap with the query in title and body
- duplicate-risk candidate that the system should definitely surface before generation

`related` should mean:

- relevant but not central
- good supporting context
- possible relation target

### What graph signals should do in MVP

Graph signals should not rank the corpus globally.

They may only:

- break ties between already lexical candidates
- add at most one one-hop neighbor to a chosen strong anchor
- surface incoming/outgoing note titles for explanation

### What should be postponed

- embeddings
- hybrid rank fusion
- multi-hop graph expansion
- PageRank-style centrality
- learned ranking models
- query rewriting inside ranking logic

## 8. Proposed Match / Context Contracts

The current `Match` type is too thin for explainable retrieval and too coupled to placeholder context logic. The system needs a clearer contract split.

### Search query contract

```ts
type SearchStage = "search-1" | "search-2"

type SearchQuery = {
  text: string
  stage: SearchStage
  limit: number
  excludeIds?: string[]
}
```

Responsibility:

- owned by Core at the pipeline boundary
- passed into Indexing
- keeps stage intent explicit

### Match contract

```ts
type MatchBucket = "strong" | "related"

type MatchSignal =
  | "exact_title"
  | "title_overlap"
  | "alias_match"
  | "content_overlap"
  | "wikilink_overlap"
  | "tag_overlap"
  | "graph_neighbor"

type NoteMatch = {
  noteId: string
  title: string
  path: string
  bucket: MatchBucket
  score: number
  signals: MatchSignal[]
  reason: string
}
```

Responsibility:

- owned by Indexing
- represents a lightweight retrieval decision
- does not contain full note content

### Retrieval result contract

```ts
type RetrievalResult = {
  query: SearchQuery
  strong: NoteMatch[]
  related: NoteMatch[]
}
```

Responsibility:

- owned by Indexing
- gives Core a stable, explainable search result
- keeps strong and related grouped instead of forcing Core to infer buckets later

### Context item contract

```ts
type ContextRole = "primary" | "supporting" | "neighbor"

type ContextItem = {
  noteId: string
  title: string
  path: string
  content: string
  role: ContextRole
  sourceMatch?: NoteMatch
  includedBecause: string
}
```

Responsibility:

- owned by Core
- full-content payload that can enter prompts
- records provenance for transparency

### Generation context contract

```ts
type GenerationContext = {
  stage: "generation" | "refinement"
  primary?: ContextItem
  supporting: ContextItem[]
  omitted: { noteId: string; reason: string }[]
}
```

Responsibility:

- owned by Core
- prompt-ready local knowledge slice
- intentionally smaller than raw retrieval result

### Graph lookup contract

```ts
type NeighborLookup = {
  noteId: string
  outgoing: string[]
  incoming: string[]
}
```

Responsibility:

- owned by Indexing
- used only when Core decides a one-hop expansion is justified

## 9. Proposed ContextBuilder Strategy

### Ownership

`ContextBuilder` should stay in Core, because prompt context selection is a pipeline decision, not an indexing concern and not an LLM concern.

### Inputs

`ContextBuilder` should receive:

- the pipeline stage: generation or refinement
- the retrieval result
- a note content resolver from indexing or storage
- optional one-hop graph lookup
- size limits

### Outputs

It should return:

- `GenerationContext`
- a selection trace that explains what was included and excluded

### Selection rules

For MVP, use these rules:

1. Take the top `strong` match as `primary` if one exists.
2. Add up to 2 additional `strong` matches as supporting only if they are not near-duplicates of the primary.
3. Add up to 2 `related` matches as supporting.
4. Only consider one-hop graph neighbors if:
   - there is a primary note
   - the neighbor is directly connected to that primary
   - the neighbor did not already rank as a direct lexical hit
   - the neighbor helps explain or disambiguate the primary
5. Never exceed a small fixed note count.

Recommended hard bounds:

- generation context: 1 primary + up to 3 supporting
- refinement context: 1 primary + up to 4 supporting
- optional one-hop neighbor count: at most 1

### What note content to include

Because Byblos notes are intentionally short and atomic, prompt context should include full note content for selected notes rather than snippets. That is both simpler and more transparent.

Include:

- title
- full body content
- optionally the note’s typed links summary as a compact line if available

Exclude:

- frontmatter dumps
- large metadata blocks
- unrelated neighbor lists
- full graph neighborhoods
- scoring internals inside the prompt text

### Redundancy reduction

Before finalizing context:

- dedupe by note id
- collapse near-identical titles
- prefer direct lexical hits over graph-expanded neighbors
- drop supporting notes that contribute no distinct concepts

### Transparency

`ContextBuilder` should produce an explicit selection trace, for example:

- included `Responsibility` as primary because of exact title overlap
- included `Reason` as supporting because of body overlap
- included `Moral Agency` as neighbor because it is directly linked from the primary
- omitted `Symbolic Order` because it matched only one weak body token

That trace should stay available to logs and review UI even if it is not shown in every prompt.

## 10. Graph Usage Policy

### Useful now

Useful graph behavior in MVP:

- resolve outgoing and incoming one-hop neighbors
- use graph edges to explain why a note is adjacent to a strong match
- use graph edges as a secondary expansion after lexical anchoring

### Premature now

Premature graph behavior:

- multi-hop traversal
- ranking by graph centrality
- community detection
- injecting full neighborhoods into prompts
- graph-only retrieval without lexical anchors

### Inclusion policy

Linked notes should enter context only when:

- a direct lexical anchor already exists
- the linked note is one hop away
- it adds a clearly distinct but relevant concept
- the total context still stays within the fixed bound

Linked notes should stay out when:

- they are merely popular hubs
- they only weakly relate by generic vocabulary
- they duplicate what is already present in context
- including them would crowd out direct lexical matches

The graph should sharpen local context, not enlarge it indiscriminately.

## 11. Generation vs Refinement Retrieval Differences

The repository’s two-search pipeline is correct, and the two searches should not use identical context policy.

### Search-1 / generation

Goal:

- orient the model
- surface obvious collisions or nearby concepts
- provide local vocabulary and relation targets

Recommended retrieval mode:

- query = normalized user input
- strong emphasis on title and alias matches
- very small context
- one-hop expansion usually off

Recommended context:

- 0 or 1 primary
- up to 2 related/supporting notes
- no graph neighbor unless the primary is highly confident and directly clarifying

Why:

- early context should reduce hallucinated novelty and obvious duplication
- generation still needs room to interpret the input rather than being over-constrained by existing notes

### Search-2 / refinement

Goal:

- refine the draft against more specific note candidates
- catch duplicate or near-duplicate titles
- improve final linking targets

Recommended retrieval mode:

- query should be built from `retrievalSeed` plus normalized `search_phrases`
- score exact draft-title candidates very highly
- allow one-hop neighbor expansion from the best lexical anchors

Recommended context:

- 0 or 1 primary
- up to 3 or 4 supporting notes
- allow at most 1 graph neighbor if it clarifies the anchor set

Why:

- refinement is the step that produces final notes
- it needs stronger duplicate awareness and stronger linking awareness than draft generation

### Key difference

Generation context should be lighter and more exploratory.

Refinement context should be stricter and more collision-aware.

## 12. Recommended Module / Folder Structure

This recommendation preserves the existing top-level boundaries rather than introducing a new architecture.

```text
src/
  plugin/
    obsidian/
      ObsidianNoteStore.ts
      ObsidianIndexCache.ts
  core/
    notes/
      note-types.ts
      note-validator.ts
      commit-mapper.ts
    pipeline/
      ContextBuilder.ts
      contracts.ts
  indexing/
    build/
      build-note-index.ts
      parse-markdown-note.ts
    model/
      types.ts
    search/
      SearchModule.ts
      lexical-ranker.ts
    graph/
      graph-index.ts
  llm/
    generation/
    refinement/
    prompts/
```

Ownership boundaries:

- Plugin owns Obsidian file IO and index file placement.
- Core owns schema mapping, validation, commit rules, and context-selection policy.
- Indexing owns markdown parsing for searchable/indexable data, lexical ranking, and graph lookup.
- LLM owns prompt execution only.

Important boundary rule:

`ContextBuilder` may use indexing services, but indexing must not decide prompt policy.

## 13. Incremental Rollout Plan

### Stage 1: minimal viable storage model

- define canonical note markdown shape
- introduce title-based filename policy
- assign persistent id at commit
- write canonical files only after validation
- keep body wikilinks plus structured typed links

### Stage 2: MVP indexing

- implement markdown note scan
- build note catalog index
- build title lookup and link graph index
- rebuild on startup and after commit
- replace mock `SearchModule`

### Stage 3: MVP retrieval

- implement deterministic lexical ranking
- return grouped `strong` and `related` results with reasons
- keep graph expansion off by default

### Stage 4: real ContextBuilder

- resolve actual note contents
- enforce small fixed bounds
- add selection trace
- separate generation and refinement policies

### Stage 5: cautious graph-aware enhancement

- add optional one-hop expansion from strong anchors
- keep strict note-count limits
- measure whether it improves linking without increasing noise

### Later, only after lexical baseline is stable

- evaluate whether embeddings add real value
- only add hybrid retrieval if deterministic lexical retrieval is no longer sufficient

## 14. Risks, Tradeoffs, and Anti-Patterns

### Risks and tradeoffs

- Title-based filenames align with Obsidian and Byblos semantics, but they assume strong title uniqueness discipline.
- Keeping typed links in frontmatter plus wikilinks in body creates dual representation, but that duality is already implied by the docs and is preferable to making the index the only home of typed structure.
- Full-note context inclusion works because notes are intentionally short; if note length drifts, this policy becomes less safe.
- A flat note directory is simplest now, but it depends on good retrieval and search rather than folder browsing.

### Anti-patterns to avoid

- using the global graph as prompt context
- letting graph traversal outrank lexical evidence in MVP
- adopting embeddings before there is a stable lexical baseline
- treating derived index data as canonical truth
- using persistent ids as the primary text-layer linking mechanism
- hiding retrieval decisions inside prompts instead of explicit code contracts
- letting the LLM decide retrieval policy
- silently suffixing duplicate titles at commit
- storing retrieval scores back into canonical note files
- mixing Obsidian filesystem logic into Core

## 15. Final Recommendation

Byblos should standardize on a title-first markdown corpus with one atomic note per file, a flat managed note directory, commit-time id assignment, and rebuildable lexical plus graph indexes. Retrieval should begin as deterministic title-weighted lexical search over markdown-derived fields, with graph data limited to one-hop support after lexical anchors are already chosen.

`ContextBuilder` should become the explicit owner of stage-aware local context assembly. It should resolve full content only for a tiny selected set, distinguish generation from refinement behavior, and record why each note was included. That gives Byblos the smallest useful local knowledge slice for each LLM call while staying faithful to the repository’s actual contracts: markdown as truth, index as derivative, LLM as untrusted generator, and Core as the decision authority.

---

## 16. Finalized Decisions

### 16.1 Obsidian Vault Coexistence and File Layout

Byblos should assume that notes live inside a real Obsidian vault and may coexist with many non-Byblos notes. The Byblos storage layout should therefore be visible inside the vault, but isolated under a dedicated managed root:

```text
<vault>/Byblos/
  notes/
  .index/
```

This layout is not an internal hidden abstraction. It is part of the vault and intentionally visible to the user, because canonical markdown files must remain normal Obsidian files.

Coexistence policy:

- Byblos only reads and writes notes under `Byblos/notes/`
- Byblos does not treat the whole vault as its managed corpus in MVP
- links from Byblos notes to non-Byblos vault notes may remain as plain Obsidian wikilinks in text, but they are outside typed-link resolution in MVP
- the derived index is built only from `Byblos/notes/`

This keeps the system bounded and avoids mixing Byblos contracts with arbitrary vault content.

Flat layout decision:

- keep `Byblos/notes/` flat for MVP and first real usage
- this flat layout is the actual visible vault layout, not just an internal implementation detail

Transition rule when flat stops being workable:

- keep the same managed root
- switch from `Byblos/notes/<slug>.md` to mechanical prefix sharding

```text
<vault>/Byblos/
  notes/
    a/
    b/
    c/
    misc/
```

Sharding trigger should be operational, not conceptual:

- too many files in one folder for comfortable vault browsing
- noticeable friction in manual inspection
- file operations in the managed folder becoming noisy or slow

Transition rule:

- shard by normalized title prefix
- do not shard by type, topic, or date
- preserve title-first identity and existing wikilinks
- treat path migration as a storage-layer concern only

### 16.2 Final MVP Search and Indexing Technology

The concrete MVP implementation should be:

- frontmatter + markdown body parser implemented in TypeScript
- derived JSON index files stored under `Byblos/.index/`
- in-process TypeScript lexical scorer with explicit weights

Exact components:

1. Parser

- parse frontmatter
- extract H1 title
- extract body content
- extract wikilinks from body
- read structured typed links from frontmatter

2. Index format

- `notes.index.json`: note catalog entries
- `graph.index.json`: outgoing/incoming resolved typed-link graph
- `build-meta.json`: build timestamp, version, note count

3. Scoring layer

- pure TypeScript scoring function
- normalized tokenization for title, aliases, content, tags, wikilink targets
- explicit deterministic weights for title/alias/content/link/tag signals
- explicit bucketing into `strong` and `related`

Why this is the final MVP choice:

- fits Obsidian because the source of truth is local markdown files, not an external service
- fits the current repo because `SearchModule` is still simple and the retrieval contract is not yet stabilized
- fits Byblos because ranking behavior remains explicit, debuggable, and deterministic
- avoids premature dependency on a library whose scoring model becomes a hidden policy layer

### 16.3 Final Wikilinks vs Typed-Links Policy

Primary truth:

- semantic truth = wikilinks in note body
- structured persistence truth = typed links written by Core at commit

Typed links are not independent authorial truth in MVP. They are Core-resolved structured metadata derived from validated note text plus relation decisions accepted by Core.

Obsidian-style links must be preserved exactly as the user-facing text-layer link system:

- keep `[[Title]]` links in note bodies
- do not replace body links with ids
- do not expose storage ids in generated note text

Exact commit-time flow:

1. LLM returns raw markdown note bodies.
2. Core parser parses note segments and META.
3. Core validator validates structural output.
4. Core mapper extracts titles and body wikilinks from note text.
5. Core resolves each wikilink target by normalized title lookup.
6. Core resolves intra-batch links between newly generated notes before persistence.
7. Core constructs typed links with `targetId` from resolved targets.
8. Core validates that the final structured links are fully consistent with the body wikilinks.
9. Plugin persists canonical markdown with frontmatter + original body text.

Strict mismatch rules:

- body wikilink with no unique resolvable target -> reject commit
- typed link candidate with no corresponding body wikilink -> reject commit
- ambiguous title match -> reject commit
- unresolved external vault note outside `Byblos/notes/` -> keep only as body wikilink, do not emit typed link in MVP
- no silent repair, no guessed target, no fallback id invention

Validation vs transformation boundary:

- Core validates the LLM-proposed text links
- Core transforms resolvable text links into typed links at commit
- Core validates the final typed-link structure before persistence

This keeps Obsidian-style links intact while ensuring that the structured graph remains a Core-owned, validated artifact.

## IMPLEMENTATION PLAN (STRICT)

### A. Modules to create/update

Create:

- `src/plugin/obsidian/ObsidianNoteStore.ts`
- `src/plugin/obsidian/ObsidianIndexStore.ts`
- `src/indexing/build/parse-markdown-note.ts`
- `src/indexing/build/build-note-index.ts`
- `src/indexing/search/lexical-ranker.ts`
- `src/core/commit/resolve-links.ts`
- `src/core/commit/build-canonical-note.ts`
- `src/core/commit/commit-notes.ts`

Update:

- `src/indexing/types.ts`
- `src/indexing/search/SearchModule.ts`
- `src/core/pipeline/ContextBuilder.ts`
- `src/core/pipeline/contracts.ts`
- `src/core/pipeline/PipelineOrchestrator.ts`
- `src/core/generation/mapper/note-mapper.ts`
- `src/main.ts`

### B. Step-by-step plan

1. Define canonical storage root as `Byblos/notes/` and index root as `Byblos/.index/`.
2. Implement markdown note parser for managed notes only.
3. Implement index builder that scans `Byblos/notes/` and writes `notes.index.json`, `graph.index.json`, and `build-meta.json`.
4. Replace mock `SearchModule` with JSON-backed lexical retrieval using explicit scoring.
5. Expand retrieval contracts to return grouped `strong` and `related` matches with reasons.
6. Replace placeholder `ContextBuilder` content loading with real note resolution from indexed paths.
7. Add commit-layer link resolution from body wikilinks to typed links with `targetId`.
8. Add canonical note writer that persists frontmatter plus original markdown body.
9. Wire plugin command to run the real pipeline and persist only validated committed notes.
10. Rebuild index after every successful commit.

### C. Minimal interfaces

```ts
type IndexedNote = {
  id: string
  path: string
  title: string
  normalizedTitle: string
  aliases: string[]
  tags: string[]
  content: string
  outgoingWikiLinks: string[]
  outgoingTypedLinks: { type: string; targetId: string }[]
}

type SearchQuery = {
  text: string
  stage: "search-1" | "search-2"
  limit: number
}

type NoteMatch = {
  noteId: string
  title: string
  path: string
  bucket: "strong" | "related"
  score: number
  reason: string
}

type RetrievalResult = {
  strong: NoteMatch[]
  related: NoteMatch[]
}

type ContextItem = {
  noteId: string
  title: string
  path: string
  content: string
  includedBecause: string
}

type ResolvedTypedLink = {
  type: string
  targetId: string
}
```

### D. First working milestone

Done means:

- Byblos reads only `Byblos/notes/` from the vault
- index rebuild works from local markdown files
- `SearchModule` returns deterministic `strong` and `related` matches from real notes
- `ContextBuilder` injects real note content instead of placeholders
- final note commit writes canonical markdown with frontmatter and preserved body wikilinks
- typed links are resolved from body wikilinks at commit
- unresolved or ambiguous links reject commit

### E. Risks during implementation

- current runtime `Node` contract is thinner than the documented note schema
- existing plugin command in `src/main.ts` bypasses the real pipeline and must be replaced carefully
- title normalization must be identical across parser, search, and commit resolution
- intra-batch link resolution must handle links between newly generated notes before files exist
- non-Byblos vault notes must not accidentally enter the managed index
