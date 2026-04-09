// core/generation/parser/parse-llm-output.ts

import {
  ParseLlmOutputResult,
  ParsedLlmOutput,
  ParsedMeta,
  ParsedMetaValue,
} from "./types";
import {
  createParseError,
  emptyNoteArea,
  emptyNoteSegment,
  invalidArrayItem,
  invalidMetaLine,
  missingMetaMarker,
  multipleMetaMarkers,
  nestedArrayNotAllowed,
  unclosedArray,
} from "./errors";

const META_MARKER = "<<<META>>>";
const NOTE_MARKER = "<<<NOTE>>>";

export const parseLlmOutput = (raw: string): ParseLlmOutputResult => {
  const metaMarkerMatches = raw.match(/<<<META>>>/g) ?? [];

  if (metaMarkerMatches.length === 0) {
    return { ok: false, error: missingMetaMarker() };
  }

  if (metaMarkerMatches.length > 1) {
    return { ok: false, error: multipleMetaMarkers() };
  }

  const metaMarkerIndex = raw.indexOf(META_MARKER);

  const rawNoteArea = raw.slice(0, metaMarkerIndex).trim();
  const rawMetaArea = raw.slice(metaMarkerIndex + META_MARKER.length).trim();

  if (rawNoteArea.length === 0) {
    return { ok: false, error: emptyNoteArea() };
  }

  const notesResult = parseNotes(rawNoteArea);

  if (!notesResult.ok) {
    return notesResult;
  }

  const metaResult = parseMeta(rawMetaArea);

  if (!metaResult.ok) {
    return metaResult;
  }

  const value: ParsedLlmOutput = {
    notes: notesResult.value,
    meta: metaResult.value,
    rawNoteArea,
    rawMetaArea,
  };

  return { ok: true, value };
};

const parseNotes = (
  rawNoteArea: string,
):
  | { ok: true; value: string[] }
  | { ok: false; error: ReturnType<typeof emptyNoteSegment> } => {
  const segments = rawNoteArea
    .split(NOTE_MARKER)
    .map((segment) => segment.trim());

  if (segments.some((segment) => segment.length === 0)) {
    return { ok: false, error: emptyNoteSegment() };
  }

  return { ok: true, value: segments };
};

const parseMeta = (
  rawMetaArea: string,
):
  | { ok: true; value: ParsedMeta }
  | { ok: false; error: ReturnType<typeof createParseError> } => {
  if (rawMetaArea.length === 0) {
    return { ok: true, value: {} };
  }

  const lines = rawMetaArea.split(/\r?\n/);
  const meta: ParsedMeta = {};

  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    const lineNumber = index + 1;

    if (line.length === 0) {
      index += 1;
      continue;
    }

    const keyValueMatch = line.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*=\s*(.*)$/);

    if (!keyValueMatch) {
      return {
        ok: false,
        error: invalidMetaLine(lineNumber, rawLine),
      };
    }

    const [, key, valuePart] = keyValueMatch;

    if (valuePart === "[") {
      const arrayResult = parseMetaArray(lines, index + 1);

      if (!arrayResult.ok) {
        return arrayResult;
      }

      meta[key] = arrayResult.value.items;
      index = arrayResult.value.nextIndex;
      continue;
    }

    if (valuePart.includes("[") || valuePart.includes("]")) {
      return {
        ok: false,
        error: nestedArrayNotAllowed(),
      };
    }

    meta[key] = valuePart;
    index += 1;
  }

  return { ok: true, value: meta };
};

const parseMetaArray = (
  lines: string[],
  startIndex: number,
):
  | { ok: true; value: { items: string[]; nextIndex: number } }
  | { ok: false; error: ReturnType<typeof createParseError> } => {
  const items: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();
    const lineNumber = index + 1;

    if (line.length === 0) {
      index += 1;
      continue;
    }

    if (line === "]") {
      return {
        ok: true,
        value: {
          items,
          nextIndex: index + 1,
        },
      };
    }

    if (line === "[" || line.includes("[") || line.includes("]")) {
      return {
        ok: false,
        error: nestedArrayNotAllowed(),
      };
    }

    if (!line.startsWith("- ")) {
      return {
        ok: false,
        error: invalidArrayItem(lineNumber, rawLine),
      };
    }

    const item = line.slice(2).trim();

    if (item.length === 0) {
      return {
        ok: false,
        error: invalidArrayItem(lineNumber, rawLine),
      };
    }

    items.push(item);
    index += 1;
  }

  return {
    ok: false,
    error: unclosedArray(),
  };
};
