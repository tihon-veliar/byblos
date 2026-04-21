import { normalizePath, type App } from "obsidian";
import { normalizeTitle, sanitizeNoteFileStem } from "../../indexing/normalize";

export const BYBLOS_ROOT = "Byblos";
export const BYBLOS_NOTES_ROOT = `${BYBLOS_ROOT}/notes`;
export const BYBLOS_INDEX_ROOT = `${BYBLOS_ROOT}/.index`;

export class ObsidianNoteStore {
  constructor(private readonly app: App) {}

  async ensureManagedFolders(): Promise<void> {
    await this.ensureFolder(BYBLOS_ROOT);
    await this.ensureFolder(BYBLOS_NOTES_ROOT);
    await this.ensureFolder(BYBLOS_INDEX_ROOT);
  }

  async listManagedNotes(): Promise<Array<{ path: string; raw: string }>> {
    const files = this.app.vault
      .getMarkdownFiles()
      .filter((file) => file.path.startsWith(`${BYBLOS_NOTES_ROOT}/`))
      .sort((left, right) => left.path.localeCompare(right.path));

    const notes: Array<{ path: string; raw: string }> = [];

    for (const file of files) {
      notes.push({
        path: file.path,
        raw: await this.app.vault.cachedRead(file),
      });
    }

    return notes;
  }

  async hasUnmanagedNoteWithTitle(title: string): Promise<boolean> {
    const normalizedTarget = normalizeTitle(title);

    return this.app.vault.getMarkdownFiles().some((file) => {
      if (file.path.startsWith(`${BYBLOS_NOTES_ROOT}/`)) {
        return false;
      }

      if (normalizeTitle(file.basename) === normalizedTarget) {
        return true;
      }

      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      const aliases = readAliases(frontmatter?.aliases);

      return aliases.some((alias) => normalizeTitle(alias) === normalizedTarget);
    });
  }

  async noteExists(path: string): Promise<boolean> {
    return Boolean(this.app.vault.getAbstractFileByPath(normalizePath(path)));
  }

  buildManagedNotePath(title: string): string {
    return normalizePath(
      `${BYBLOS_NOTES_ROOT}/${sanitizeNoteFileStem(title)}.md`,
    );
  }

  async writeCanonicalNote(path: string, content: string): Promise<void> {
    const normalizedPath = normalizePath(path);
    const existing = this.app.vault.getAbstractFileByPath(normalizedPath);

    if (existing) {
      throw new Error(`Managed note already exists: ${normalizedPath}`);
    }

    await this.app.vault.create(normalizedPath, content);
  }

  private async ensureFolder(path: string): Promise<void> {
    const normalized = normalizePath(path);

    if (!this.app.vault.getAbstractFileByPath(normalized)) {
      await this.app.vault.createFolder(normalized);
    }
  }
}

function readAliases(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}
