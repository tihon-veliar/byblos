import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildNoteIndex } from "../indexing/build/build-note-index";
import { createSearchModule } from "../indexing/search/SearchModule";
import { ContextBuilder } from "../core/pipeline/ContextBuilder";
import { commitNotes } from "../core/commit/commit-notes";
import type { IndexedNote, LinkGraphIndex } from "../indexing/types";
import type { Node } from "../core/pipeline/contracts";
import { normalize } from "../core/pipeline/Normalizer";

const SANDBOX_ROOT = path.resolve(".sandbox-vault");
const NOTES_ROOT = path.join(SANDBOX_ROOT, "Byblos", "notes");
const INDEX_ROOT = path.join(SANDBOX_ROOT, "Byblos", ".index");

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const keep = args.includes("--keep");
  const input =
    args.filter((arg) => arg !== "--keep").join(" ").trim() ||
    "Human agency relates to responsibility";

  if (!keep) {
    await resetSandbox();
  }
  await seedManagedNotes({ overwrite: !keep });

  const beforeSnapshot = await rebuildIndexes();
  const searchModule = createSearchModule(beforeSnapshot);
  const normalizedInput = normalize(input);
  const search1 = searchModule.search({
    text: normalizedInput,
    stage: "search-1",
    limit: 5,
  });
  const context = ContextBuilder.build({
    stage: "generation",
    retrieval: search1,
    resolveNote: (noteId) => searchModule.getNoteById(noteId),
    getNeighborLookup: (noteId) => searchModule.getNeighborLookup(noteId),
  });

  const nodes = buildSandboxNodes(input);

  const committed = await commitNotes({
    nodes,
    existingNotes: beforeSnapshot.notes,
    buildPathForTitle: (title) => path.relative(SANDBOX_ROOT, path.join(NOTES_ROOT, `${slugify(title)}.md`)).replace(/\\/g, "/"),
    noteExists: async (relativePath) => exists(path.join(SANDBOX_ROOT, relativePath)),
    writeCanonicalNote: async (relativePath, content) => {
      const absolutePath = path.join(SANDBOX_ROOT, relativePath);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, content, "utf8");
    },
    hasUnmanagedNoteWithTitle: async () => false,
  });

  const afterSnapshot = await rebuildIndexes();
  const graph = afterSnapshot.graph;

  printSection("Sandbox Root", SANDBOX_ROOT);
  printSection("Mode", keep ? "keep existing corpus" : "reset sandbox");
  printSection("Input", input);
  printJson("Search-1", search1);
  printJson("Context", context);
  printJson("Committed", committed);
  printJson("Indexed Notes After Commit", afterSnapshot.notes.map(summarizeNote));
  printJson("Graph Index", graph);
}

function buildSandboxNodes(input: string): Node[] {
  const title = deriveTitleFromInput(input);

  return [
    {
      id: "sandbox-node-1",
      title,
      content: `${input}. Agency remains connected to [[Responsibility]].`,
      rawMarkdown: `# ${title}

${input}. Agency remains connected to [[Responsibility]].`,
      wikiLinks: ["Responsibility"],
    },
  ];
}

async function seedManagedNotes(input: { overwrite: boolean }): Promise<void> {
  await mkdir(NOTES_ROOT, { recursive: true });
  await mkdir(INDEX_ROOT, { recursive: true });

  const responsibility = `---
id: note_20260419_01
type: zettel
epistemicMode: verified
claimStatus: supported
reviewStatus: committed
aliases: []
tags: [ethics]
links: []
createdAt: 2026-04-19T10:00:00.000Z
committedAt: 2026-04-19T10:00:00.000Z
---

# Responsibility

Responsibility depends on agency and practical reasoning.`;

  const reason = `---
id: note_20260419_02
type: zettel
epistemicMode: speculative
claimStatus: hypothetical
reviewStatus: committed
aliases: []
tags: [mind]
links:
  - type: extends
    targetId: note_20260419_01
createdAt: 2026-04-19T10:05:00.000Z
committedAt: 2026-04-19T10:05:00.000Z
---

# Reason

Reason helps explain why agents can be responsible and links to [[Responsibility]].`;

  await writeSeedNote("responsibility.md", responsibility, input.overwrite);
  await writeSeedNote("reason.md", reason, input.overwrite);
}

async function rebuildIndexes() {
  const notes = await readManagedNotes();
  const snapshot = buildNoteIndex({
    notes,
    builtAt: "2026-04-20T12:34:56.000Z",
  });

  await writeFile(
    path.join(INDEX_ROOT, "notes.index.json"),
    JSON.stringify(snapshot.notes, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(INDEX_ROOT, "graph.index.json"),
    JSON.stringify(snapshot.graph, null, 2),
    "utf8",
  );
  await writeFile(
    path.join(INDEX_ROOT, "build-meta.json"),
    JSON.stringify(snapshot.buildMeta, null, 2),
    "utf8",
  );

  return snapshot;
}

async function readManagedNotes(): Promise<Array<{ path: string; raw: string }>> {
  const entries = await readdir(NOTES_ROOT);
  const notes = [];

  for (const entry of entries.sort()) {
    const absolutePath = path.join(NOTES_ROOT, entry);
    const info = await stat(absolutePath);

    if (!info.isFile() || !entry.endsWith(".md")) {
      continue;
    }

    notes.push({
      path: path.relative(SANDBOX_ROOT, absolutePath).replace(/\\/g, "/"),
      raw: await readFile(absolutePath, "utf8"),
    });
  }

  return notes;
}

async function resetSandbox(): Promise<void> {
  await rm(SANDBOX_ROOT, { recursive: true, force: true });
  await mkdir(SANDBOX_ROOT, { recursive: true });
}

async function exists(target: string): Promise<boolean> {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function writeSeedNote(
  filename: string,
  content: string,
  overwrite: boolean,
): Promise<void> {
  const target = path.join(NOTES_ROOT, filename);

  if (!overwrite && (await exists(target))) {
    return;
  }

  await writeFile(target, content, "utf8");
}

function summarizeNote(note: IndexedNote): object {
  return {
    id: note.id,
    title: note.title,
    path: note.path,
    outgoingWikiLinks: note.outgoingWikiLinks,
    outgoingTypedLinks: note.outgoingTypedLinks,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-");
}

function deriveTitleFromInput(input: string): string {
  const cleaned = input
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return cleaned || "Sandbox Note";
}

function printSection(title: string, value: string): void {
  console.log(`\n=== ${title} ===`);
  console.log(value);
}

function printJson(title: string, value: unknown): void {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(value, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
