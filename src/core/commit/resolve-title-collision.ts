import { normalizeTitle } from "../../indexing/normalize";

export type TitleCollisionResolution =
  | {
      kind: "unique";
      title: string;
    }
  | {
      kind: "linked_variant";
      title: string;
      originNoteId: string;
      originTitle: string;
      linkType: "extends";
    };

type ExistingTitle = {
  id: string;
  title: string;
};

export function resolveTitleCollision(input: {
  requestedTitle: string;
  existingNotes: ExistingTitle[];
  reservedTitles?: string[];
}): TitleCollisionResolution {
  const reserved = new Set((input.reservedTitles ?? []).map(normalizeTitle));
  const normalizedRequested = normalizeTitle(input.requestedTitle);
  const matchingExistingNotes = input.existingNotes.filter(
    (note) => normalizeTitle(note.title) === normalizedRequested,
  );

  if (matchingExistingNotes.length > 1) {
    throw new Error(
      `Ambiguous managed note title collision target: ${input.requestedTitle}`,
    );
  }

  if (matchingExistingNotes.length === 0 && !reserved.has(normalizedRequested)) {
    return {
      kind: "unique",
      title: input.requestedTitle,
    };
  }

  if (matchingExistingNotes.length === 0) {
    throw new Error(`Duplicate generated title: ${input.requestedTitle}`);
  }

  const origin = matchingExistingNotes[0];
  const baseTitle = `${origin.title}: развитие`;
  let title = baseTitle;
  let suffix = 2;

  while (
    reserved.has(normalizeTitle(title)) ||
    input.existingNotes.some((note) => normalizeTitle(note.title) === normalizeTitle(title))
  ) {
    title = `${baseTitle} ${suffix}`;
    suffix += 1;
  }

  return {
    kind: "linked_variant",
    title,
    originNoteId: origin.id,
    originTitle: origin.title,
    linkType: "extends",
  };
}
