# OBSIDIAN_EXISTING_FOLDER_INTEGRATION_PLAN

## Goal

Integrate the current MVP storage/indexing/retrieval/commit flow into Obsidian in the smallest practical way:

- read from an existing managed notes folder inside the user's vault
- write new Byblos notes back into that same managed folder
- rebuild indexes from that folder only
- avoid expanding scope to the whole vault

## Recommended First Scope

Use one managed corpus root inside the vault:

```text
<vault>/Byblos/
  notes/
  .index/
```

Support this as the default layout, but structure the plugin so the notes root and index root can later become user-configurable settings.

For the first integration step:

- read only `Byblos/notes/`
- write only `Byblos/notes/`
- rebuild indexes only from `Byblos/notes/`
- persist index files only under `Byblos/.index/`

Do not read the whole vault.
Do not treat arbitrary vault notes as Byblos-managed notes.

## Why Start Here

This is the smallest path from sandbox validation to real plugin usage:

- the core MVP already works on a bounded markdown corpus
- retrieval stays deterministic and explainable
- commit rules stay strict
- existing user vault structure is not disturbed
- Obsidian integration remains thin and plugin-only

## Phase 1

### Existing Folder Support

Implement plugin support for working against a real managed folder that already exists in the vault.

Behavior:

- if `Byblos/notes/` exists, use it
- if `Byblos/.index/` exists, use it
- if missing, create them
- scan existing markdown files in `Byblos/notes/`
- build derived indexes from those files
- commit newly generated canonical notes back into that folder

Success criteria:

- existing markdown notes in `Byblos/notes/` are indexed
- search/context use those existing notes
- new committed notes appear in the same folder
- indexes refresh after commit

## Phase 2

### Plugin Settings

Add minimal plugin settings:

- `managedNotesRoot`
- `managedIndexRoot`

Default values:

- `Byblos/notes`
- `Byblos/.index`

Rules:

- keep notes root and index root bounded to explicit paths
- do not silently widen scope to the whole vault
- validate empty or invalid paths in the settings UI

Success criteria:

- user can point Byblos at a different managed notes folder
- rebuild and commit use the configured paths

## Phase 3

### Commands on Real Vault Data

Support two stable user-facing commands:

1. `Byblos: Rebuild Managed Index`
2. `Byblos: Generate and Commit Notes`

Expected command behavior:

`Rebuild Managed Index`

- scans managed notes folder
- parses canonical markdown
- rebuilds `notes.index.json`, `graph.index.json`, `build-meta.json`

`Generate and Commit Notes`

- accepts user input
- runs normalize -> search-1 -> context -> generation -> search-2 -> refinement
- commits validated notes into managed notes folder
- rebuilds index after successful commit

## Explicit Non-Goals for This Step

Do not add:

- whole-vault indexing
- embeddings
- semantic search
- vector storage
- automatic migration of arbitrary vault notes into Byblos schema
- automatic editing of existing notes
- uncontrolled graph expansion

## Immediate Implementation Order

1. Keep current default paths as `Byblos/notes` and `Byblos/.index`
2. Make plugin reliably read existing notes from that folder
3. Confirm commit writes back to the same folder
4. Add settings only after the default-path flow is stable

## Practical Next Coding Step

The next concrete implementation step should be:

- add plugin settings scaffolding
- keep defaults at `Byblos/notes` and `Byblos/.index`
- route `ObsidianNoteStore` and `ObsidianIndexStore` through those settings
- verify that existing notes in the configured folder participate in retrieval and context assembly
