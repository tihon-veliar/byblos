# Iterative Expansion Mode

## Status
Proposal only.

This document describes a possible separate operating mode for Byblos.
It is not a replacement for the main pipeline and should not redefine the default single-pass generation flow.

## Goal
Add an optional mode that can start from a seed topic and iteratively expand a knowledge area until a configured stopping point is reached.

Example intent:
- start from a thematic seed such as `Культурные традиции и память`
- generate and commit notes
- inspect the resulting notes for broad or underdeveloped subtopics
- continue expanding those subtopics in later passes

## Important Constraint
This should be implemented as a separate mode of operation, not as the default pipeline.

The current main pipeline should remain:
- input
- retrieval
- generation
- refinement
- commit
- reindex

The new mode should wrap that pipeline and call it repeatedly under a policy.

## Concept
The system already has most of the primitives needed for iterative expansion:
- a single-run orchestrator
- retrieval over the managed corpus
- generation and refinement prompts
- canonical markdown commit
- reindex after commit

The missing piece is a controller that decides:
- what to expand next
- when to stop
- how to avoid loops and duplicate growth

## Proposed Separate Mode
Suggested name:
- `expansion mode`

Suggested behavior:
1. accept a seed topic
2. run the existing pipeline once
3. commit notes
4. rebuild indexes
5. inspect new notes and derive candidate subtopics
6. enqueue the best candidates
7. repeat until stop conditions are met

## Why It Should Be Separate
Reasons to keep this out of the default pipeline:
- the default pipeline should stay simple, deterministic, and easy to reason about
- iterative expansion introduces queue management, stopping rules, and loop control
- the UX is different from normal single-request note generation
- this mode is exploratory and corpus-shaping, not just note generation

## MVP Design
Minimal building blocks:
- `ExpansionRunner`
- `ExpansionQueue`
- `ExpansionPolicy`

Responsibilities:

`ExpansionRunner`
- owns the loop
- invokes the existing pipeline
- commits notes
- rebuilds indexes between passes

`ExpansionQueue`
- stores pending topics
- prevents repeated work on the same normalized topic
- tracks depth and ancestry

`ExpansionPolicy`
- decides whether a note is broad enough to expand
- extracts candidate subtopics
- decides when expansion should stop

## Stop Conditions
Possible stop conditions:
- max depth reached
- max total notes reached
- max iterations reached
- no new committed notes in the last pass
- no new distinct subtopics discovered
- candidate topics are duplicates of already explored topics

## Broad-Note Heuristics
Notes that may be worth expanding:
- notes that sound like umbrella topics
- notes that list several practices, places, actors, or events
- notes that contain many semantic branches but little concrete detail
- notes whose titles indicate a domain rather than a single fact or object

Examples:
- cultural traditions
- social structure
- memory practices
- economy of the village

## Candidate Sources For Further Expansion
Candidates can come from:
- generated retrieval phrases
- broad newly committed notes
- unresolved semantic targets
- notes with dense enumerations of subtopics

## Risks
Main risks:
- semantic loops
- duplicate notes
- repeated paraphrases of the same concept
- endless expansion of umbrella categories
- drift away from the original seed

## Guardrails
Useful protections:
- normalized topic registry
- per-topic retry limits
- duplicate detection before enqueue
- preference for concrete subtopics over vague categories
- stop when recent passes add no meaningful novelty

## Implementation Options
### Option A
Add a small wrapper service around the current pipeline.

Pros:
- minimal architectural disruption
- reuses existing commit and index flow
- easiest MVP

Cons:
- policy logic may become heuristic-heavy

### Option B
Add a dedicated expansion module in `core`.

Pros:
- clearer boundaries
- easier to test as a separate subsystem

Cons:
- more upfront structure than the MVP may need

### Option C
Expose expansion mode only in sandbox first.

Pros:
- fastest experimentation loop
- lower risk to plugin UX
- easier prompt and policy tuning

Cons:
- not immediately available in production plugin flow

## Recommended Path
Recommended sequence:
1. prototype expansion mode in sandbox
2. define simple stop rules and duplicate protections
3. test quality on a few thematic seeds
4. only then decide whether to move it into plugin-facing commands

This keeps the main Byblos pipeline stable while allowing iterative worldbuilding or topic expansion as an explicit advanced mode.
