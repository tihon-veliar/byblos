import type {
  NeighborLookup,
  RetrievalResult,
  SearchQuery,
} from "../../core/pipeline/contracts";
import type { IndexedNote, NoteIndexSnapshot } from "../types";
import { rankLexicalMatches } from "./lexical-ranker";

export function createSearchModule(snapshot: NoteIndexSnapshot) {
  const notesById = new Map<string, IndexedNote>(
    snapshot.notes.map((note) => [note.id, note]),
  );

  return {
    search(query: SearchQuery): RetrievalResult {
      return rankLexicalMatches(query, snapshot);
    },
    getNoteById(noteId: string): IndexedNote | undefined {
      return notesById.get(noteId);
    },
    getNeighborLookup(noteId: string): NeighborLookup | undefined {
      const note = notesById.get(noteId);

      if (!note) {
        return undefined;
      }

      return {
        noteId,
        outgoing: snapshot.graph.outgoingById[noteId] ?? [],
        incoming: snapshot.graph.incomingById[noteId] ?? [],
      };
    },
    getSnapshot(): { notes: IndexedNote[] } {
      return {
        notes: snapshot.notes,
      };
    },
  };
}

export type SearchModule = ReturnType<typeof createSearchModule>;
