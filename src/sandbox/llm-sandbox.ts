import {
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { buildNoteIndex } from "../indexing/build/build-note-index";
import { createSearchModule } from "../indexing/search/SearchModule";
import { ContextBuilder } from "../core/pipeline/ContextBuilder";
import { commitNotes } from "../core/commit/commit-notes";
import { normalize } from "../core/pipeline/Normalizer";
import { PipelineOrchestrator } from "../core/pipeline/PipelineOrchestrator";
import { ResultAssembler } from "../core/pipeline/ResultAssembler";
import { GenerationModule } from "../llm/generation/GenerationModule";
import { RefinementModule } from "../llm/refinement/RefinementModule";
import { getLlmConfigFromEnv } from "../llm/infra/config";
import type { IndexedNote } from "../indexing/types";
import { sanitizeNoteFileStem } from "../indexing/normalize";

const SANDBOX_ROOT = path.resolve(".sandbox-vault-llm");
const NOTES_ROOT = path.join(SANDBOX_ROOT, "Byblos", "notes");
const INDEX_ROOT = path.join(SANDBOX_ROOT, "Byblos", ".index");

async function main(): Promise<void> {
  ensureLlmEnv();

  const args = process.argv.slice(2);
  const keep = args.includes("--keep");
  const userInput = await readSandboxInput(
    args.filter((arg) => arg !== "--keep"),
  );
  if (!keep) {
    await resetSandbox();
  }
  await seedManagedNotes({ overwrite: !keep });

  const beforeSnapshot = await rebuildIndexes();
  const searchModule = createSearchModule(beforeSnapshot);
  const orchestrator = new PipelineOrchestrator({
    Normalizer: { normalize },
    SearchModule: searchModule,
    ContextBuilder,
    GenerationModule,
    RefinementModule,
    LinkProposalModule: { propose: () => [] },
    ResultAssembler,
  });

  const pipelineResult = await orchestrator.run({ text: userInput });

  const committed = await commitNotes({
    nodes: pipelineResult.nodes,
    proposedLinks: pipelineResult.links,
    existingNotes: beforeSnapshot.notes,
    buildPathForTitle: (title) =>
      path
        .relative(
          SANDBOX_ROOT,
          path.join(NOTES_ROOT, `${sanitizeNoteFileStem(title)}.md`),
        )
        .replace(/\\/g, "/"),
    noteExists: async (relativePath) =>
      exists(path.join(SANDBOX_ROOT, relativePath)),
    writeCanonicalNote: async (relativePath, content) => {
      const absolutePath = path.join(SANDBOX_ROOT, relativePath);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, content, "utf8");
    },
    hasUnmanagedNoteWithTitle: async () => false,
  });

  const afterSnapshot = await rebuildIndexes();

  printSection("Sandbox Root", SANDBOX_ROOT);
  printSection("Mode", keep ? "keep existing corpus" : "reset sandbox");
  printSection("Input", userInput);
  printJson("Pipeline Result", {
    status: pipelineResult.status,
    nodes: pipelineResult.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      wikiLinks: node.wikiLinks,
    })),
    links: pipelineResult.links,
    matches: pipelineResult.matches,
  });
  printJson("Committed", committed.committed);
  printJson("Unresolved Wiki Links", committed.unresolvedWikiLinks);
  printJson(
    "Indexed Notes After Commit",
    afterSnapshot.notes.map((note) => summarizeNote(note)),
  );
  printJson("Graph Index", afterSnapshot.graph);
}

function ensureLlmEnv(): void {
  if (process.env.SKIP_AI_CALL === "true") {
    throw new Error(
      "SKIP_AI_CALL=true. Set SKIP_AI_CALL=false to run the LLM sandbox.",
    );
  }

  getLlmConfigFromEnv();
}

async function readSandboxInput(args: string[]): Promise<string> {
  const argvInput = args.join(" ").trim();

  if (argvInput) {
    return argvInput;
  }

  const rl = readline.createInterface({ input, output });

  try {
    const answer = await rl.question("Byblos input: ");
    const trimmed = answer.trim();

    if (!trimmed) {
      throw new Error("Sandbox input cannot be empty.");
    }

    return trimmed;
  } finally {
    rl.close();
  }
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

# Хацберг

Выдуманя дервня с мойе ролевой игре`;

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

# Харконин

Старейшина города [[Хацберг]]. светловолосый мужчина с весьма паршивым характером`;

  await writeSeedNote("Хацберг.md", responsibility, input.overwrite);
  await writeSeedNote("Харконин.md", reason, input.overwrite);
}

async function rebuildIndexes() {
  const notes = await readManagedNotes();
  const snapshot = buildNoteIndex({ notes });

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

async function readManagedNotes(): Promise<
  Array<{ path: string; raw: string }>
> {
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

function printSection(title: string, value: string): void {
  console.log(`\n=== ${title} ===`);
  console.log(value);
}

function printJson(title: string, value: unknown): void {
  console.log(`\n=== ${title} ===`);
  console.log(JSON.stringify(value, null, 2));
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nLLM sandbox failed: ${message}`);
  process.exitCode = 1;
});
