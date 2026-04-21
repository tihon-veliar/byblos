export function normalizeTitle(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeText(value: string): string[] {
  const normalized = normalizeTitle(value);

  if (!normalized) {
    return [];
  }

  return Array.from(new Set(normalized.split(" ").filter(Boolean)));
}

export function sanitizeNoteFileStem(title: string): string {
  const normalized = title
    .normalize("NFC")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/\s*[:/\\|]+\s*/g, " - ")
    .replace(/[<>\"?*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");

  if (!normalized) {
    throw new Error("Cannot build a readable file name from an empty title.");
  }

  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(normalized)) {
    return `${normalized} note`;
  }

  return normalized;
}

export function slugifyTitle(title: string): string {
  const normalized = normalizeTitle(title);

  if (!normalized) {
    throw new Error("Cannot build a file slug from an empty title.");
  }

  return normalized.replace(/\s+/g, "-");
}
