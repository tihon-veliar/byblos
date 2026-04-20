**Implementation Report**

Implemented the MVP storage/indexing/retrieval/commit flow from `AGENTS.md` and `KNOWLEDGE_STORAGE_AND_RETRIEVAL_PROPOSAL.md`, with the proposal treated as the source of truth where older code differed.

What changed:
- Managed storage is now bounded to `Byblos/notes/` and `Byblos/.index/` via [ObsidianNoteStore.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/plugin/obsidian/ObsidianNoteStore.ts:1) and [ObsidianIndexStore.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/plugin/obsidian/ObsidianIndexStore.ts:1).
- Canonical markdown parsing/index building is implemented in [parse-markdown-note.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/indexing/build/parse-markdown-note.ts:1) and [build-note-index.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/indexing/build/build-note-index.ts:1), producing `notes.index.json`, `graph.index.json`, and `build-meta.json`.
- Deterministic lexical retrieval replaced the mock search in [lexical-ranker.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/indexing/search/lexical-ranker.ts:1) and [SearchModule.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/indexing/search/SearchModule.ts:1), with explicit title/alias/content/tag/wikilink scoring and grouped `strong` / `related` results.
- Pipeline contracts, orchestrator flow, and context assembly were updated in [contracts.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/core/pipeline/contracts.ts:1), [pipeline-modules.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/core/pipeline/pipeline-modules.ts:1), [ContextBuilder.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/core/pipeline/ContextBuilder.ts:1), and [PipelineOrchestrator.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/core/pipeline/PipelineOrchestrator.ts:1). `ContextBuilder` now uses real indexed note content, keeps context bounded, is stage-aware, and records omissions/trace.
- Commit-time link resolution and canonical persistence were added in [resolve-links.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/core/commit/resolve-links.ts:1), [build-canonical-note.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/core/commit/build-canonical-note.ts:1), and [commit-notes.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/core/commit/commit-notes.ts:1). Wikilinks remain in body text; typed links are built at commit with `targetId`, and unresolved/ambiguous managed links reject commit.
- The mapper now preserves raw markdown and extracted wikilinks in [note-mapper.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/core/generation/mapper/note-mapper.ts:1).
- The plugin entry in [main.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/main.ts:1) now rebuilds the managed index on startup, runs the real pipeline, commits canonical notes, and rebuilds the index after successful commit instead of creating timestamp-named template files directly.

Files added:
- `src/plugin/obsidian/ObsidianNoteStore.ts`
- `src/plugin/obsidian/ObsidianIndexStore.ts`
- `src/indexing/build/parse-markdown-note.ts`
- `src/indexing/build/build-note-index.ts`
- `src/indexing/search/lexical-ranker.ts`
- `src/core/commit/resolve-links.ts`
- `src/core/commit/build-canonical-note.ts`
- `src/core/commit/commit-notes.ts`
- `src/indexing/normalize.ts`

Files updated:
- `src/indexing/types.ts`
- `src/indexing/search/SearchModule.ts`
- `src/core/pipeline/ContextBuilder.ts`
- `src/core/pipeline/contracts.ts`
- `src/core/pipeline/pipeline-modules.ts`
- `src/core/pipeline/PipelineOrchestrator.ts`
- `src/core/generation/mapper/note-mapper.ts`
- `src/llm/prompts/serialize-context.ts`
- `src/llm/linking/LinkProposalModule.ts`
- `src/main.ts`
- `src/sandbox/local-run.ts`

Notable alignment with the proposal where old code differed:
- The old mock search is gone.
- The old placeholder context content is gone.
- The old plugin shortcut that wrote id-based files directly to the vault is gone.
- The old pipeline link-proposal behavior is no longer used for committed links; commit-time typed links now come only from body wikilinks, per the proposal.

**Testing Report**

Ran:
- `npm test`
- `npm run build`

Passed:
- Full Vitest suite: `49` tests passed.
- Production build completed successfully.

Added focused MVP tests:
- [parse-markdown-note.test.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/indexing/build/parse-markdown-note.test.ts:1)
- [lexical-ranker.test.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/indexing/search/lexical-ranker.test.ts:1)
- [commit-notes.test.ts](/c:/Users/Tykhon/Desktop/code_base/byblos/src/core/commit/commit-notes.test.ts:1)

Not tested:
- Live end-to-end execution inside a real Obsidian vault.
- Real LLM-backed pipeline execution through the plugin command.
- Manual coexistence scenarios with unmanaged vault notes beyond unit-level link-resolution checks.

**Test Plan**

Next tests to add:
- Obsidian store integration tests around `Byblos/notes/` and `Byblos/.index/` path enforcement.
- Index rebuild tests for multiple managed notes, graph incoming/outgoing derivation, and duplicate-title failure.
- Search tests covering exact title, alias, content, tag, and wikilink weighting boundaries.
- ContextBuilder tests for one-hop neighbor inclusion/exclusion and omission trace quality.
- Commit tests for ambiguous title resolution, intra-batch link resolution, unmanaged external note passthrough, and canonical frontmatter/body consistency.