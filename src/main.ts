import { Plugin, Notice } from "obsidian";

export default class ByblosPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "create-zettel",
      name: "Byblos: Create Zettel (Speculative)",
      callback: async () => {
        await this.createZettel();
      },
    });
    console.log("Byblos plugin loaded");
  }

  async createZettel() {
    const id = this.generateId();
    const fileName = `${id}.md`;

    const content = this.buildTemplate(id);

    await this.app.vault.create(fileName, content);

    new Notice("Byblos: Zettel created");
  }

  generateId(): string {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, "").slice(0, 15);
  }

  buildTemplate(id: string): string {
    const now = new Date().toISOString();

    return `---
id: ${id}
type: zettel

epistemicMode: speculative
claimStatus: hypothetical

links: []
sources: []

confidence: 0.3
noveltyScore: 0.5

reviewStatus: draft

createdAt: ${now}
updatedAt: ${now}
---

# New Zettel

Write one atomic idea here.
`;
  }
}
