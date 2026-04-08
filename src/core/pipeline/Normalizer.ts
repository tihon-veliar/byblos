// src/core/pipeline/Normalizer.ts

export type NormalizedInput = {
  raw: string;
  normalized: string;
};

export function normalize(input: string): string {
  const raw = input;

  const normalized = input.trim().replace(/\s+/g, " ");

  return normalized;
}
