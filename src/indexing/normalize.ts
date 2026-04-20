export function normalizeTitle(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, " ")
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

export function slugifyTitle(title: string): string {
  const normalized = normalizeTitle(title);

  if (!normalized) {
    throw new Error("Cannot build a file slug from an empty title.");
  }

  return normalized.replace(/\s+/g, "-");
}
