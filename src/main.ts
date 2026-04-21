import { Notice, Plugin } from "obsidian";
import { normalize } from "./core/pipeline/Normalizer";
import { PipelineOrchestrator } from "./core/pipeline/PipelineOrchestrator";
import { ResultAssembler } from "./core/pipeline/ResultAssembler";
import { ContextBuilder } from "./core/pipeline/ContextBuilder";
import { GenerationModule } from "./llm/generation/GenerationModule";
import { RefinementModule } from "./llm/refinement/RefinementModule";
import { ObsidianIndexStore } from "./plugin/obsidian/ObsidianIndexStore";
import { ObsidianNoteStore } from "./plugin/obsidian/ObsidianNoteStore";
import { buildNoteIndex } from "./indexing/build/build-note-index";
import {
  createSearchModule,
  type SearchModule,
} from "./indexing/search/SearchModule";
import { commitNotes } from "./core/commit/commit-notes";

export default class ByblosPlugin extends Plugin {
  private noteStore = new ObsidianNoteStore(this.app);
  private indexStore = new ObsidianIndexStore(this.app);
  private searchModule: SearchModule = createSearchModule(
    buildNoteIndex({ notes: [] }),
  );

  async onload() {
    await this.noteStore.ensureManagedFolders();
    await this.rebuildIndexes();

    this.addCommand({
      id: "run-byblos-pipeline",
      name: "Byblos: Generate and Commit Notes",
      callback: async () => {
        await this.runPipelineCommand();
      },
    });

    this.addCommand({
      id: "rebuild-byblos-index",
      name: "Byblos: Rebuild Managed Index",
      callback: async () => {
        await this.rebuildIndexes();
        new Notice("Byblos: index rebuilt");
      },
    });
  }

  private async runPipelineCommand(): Promise<void> {
    const input = window.prompt("Byblos input");

    if (!input || input.trim().length === 0) {
      return;
    }

    const orchestrator = new PipelineOrchestrator({
      Normalizer: { normalize },
      SearchModule: this.searchModule,
      ContextBuilder,
      GenerationModule,
      RefinementModule,
      LinkProposalModule: { propose: () => [] },
      ResultAssembler,
    });

    try {
      const result = await orchestrator.run({ text: input });

      const committed = await commitNotes({
        nodes: result.nodes,
        proposedLinks: result.links,
        existingNotes: this.searchModule.getSnapshot().notes,
        buildPathForTitle: (title) => this.noteStore.buildManagedNotePath(title),
        noteExists: (path) => this.noteStore.noteExists(path),
        writeCanonicalNote: (path, content) =>
          this.noteStore.writeCanonicalNote(path, content),
        hasUnmanagedNoteWithTitle: (title) =>
          this.noteStore.hasUnmanagedNoteWithTitle(title),
      });

      await this.rebuildIndexes();
      const unresolvedCount = committed.unresolvedWikiLinks.length;
      new Notice(
        unresolvedCount > 0
          ? `Byblos: committed ${committed.committed.length} note(s), ${unresolvedCount} unresolved link(s)`
          : `Byblos: committed ${committed.committed.length} note(s)`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Byblos error";
      new Notice(`Byblos error: ${message}`);
      throw error;
    }
  }

  private async rebuildIndexes(): Promise<void> {
    const notes = await this.noteStore.listManagedNotes();
    const snapshot = buildNoteIndex({ notes });
    await this.indexStore.writeIndexes(snapshot);
    this.searchModule = createSearchModule(snapshot);
  }
}
