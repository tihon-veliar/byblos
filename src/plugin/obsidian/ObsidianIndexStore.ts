import { normalizePath, type App } from "obsidian";
import {
  BYBLOS_INDEX_ROOT,
} from "./ObsidianNoteStore";
import type { BuildMeta, IndexedNote, LinkGraphIndex } from "../../indexing/types";

const NOTES_INDEX_PATH = normalizePath(`${BYBLOS_INDEX_ROOT}/notes.index.json`);
const GRAPH_INDEX_PATH = normalizePath(`${BYBLOS_INDEX_ROOT}/graph.index.json`);
const BUILD_META_PATH = normalizePath(`${BYBLOS_INDEX_ROOT}/build-meta.json`);

export class ObsidianIndexStore {
  constructor(private readonly app: App) {}

  async writeIndexes(input: {
    notes: IndexedNote[];
    graph: LinkGraphIndex;
    buildMeta: BuildMeta;
  }): Promise<void> {
    await this.writeJsonFile(NOTES_INDEX_PATH, input.notes);
    await this.writeJsonFile(GRAPH_INDEX_PATH, input.graph);
    await this.writeJsonFile(BUILD_META_PATH, input.buildMeta);
  }

  async readIndexes(): Promise<{
    notes: IndexedNote[];
    graph: LinkGraphIndex;
    buildMeta: BuildMeta;
  } | null> {
    const notes = await this.readJsonFile<IndexedNote[]>(NOTES_INDEX_PATH);
    const graph = await this.readJsonFile<LinkGraphIndex>(GRAPH_INDEX_PATH);
    const buildMeta = await this.readJsonFile<BuildMeta>(BUILD_META_PATH);

    if (!notes || !graph || !buildMeta) {
      return null;
    }

    return {
      notes,
      graph,
      buildMeta,
    };
  }

  private async readJsonFile<T>(path: string): Promise<T | null> {
    const file = this.app.vault.getAbstractFileByPath(path);

    if (!file) {
      return null;
    }

    const raw = await this.app.vault.adapter.read(path);
    return JSON.parse(raw) as T;
  }

  private async writeJsonFile(path: string, value: unknown): Promise<void> {
    const existing = this.app.vault.getAbstractFileByPath(path);
    const payload = JSON.stringify(value, null, 2);

    if (existing) {
      await this.app.vault.adapter.write(path, payload);
      return;
    }

    await this.app.vault.create(normalizePath(path), payload);
  }
}
