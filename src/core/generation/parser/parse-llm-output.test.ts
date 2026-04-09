// core/generation/parser/parse-llm-output.test.ts

import { describe, it, expect } from "vitest";
import { parseLlmOutput } from "./parse-llm-output";

describe("parseLlmOutput", () => {
  it("parses single note + empty meta", () => {
    const input = `
# Title

Text

<<<META>>>
`.trim();

    const result = parseLlmOutput(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.notes).toHaveLength(1);
    expect(result.value.meta).toEqual({});
  });

  it("parses multiple notes", () => {
    const input = `
# A

Text A

<<<NOTE>>>

# B

Text B

<<<META>>>
`.trim();

    const result = parseLlmOutput(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.notes).toHaveLength(2);
  });

  it("parses scalar meta", () => {
    const input = `
# Title

Text

<<<META>>>
key = value
`.trim();

    const result = parseLlmOutput(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.meta).toEqual({ key: "value" });
  });

  it("parses array meta", () => {
    const input = `
# Title

Text

<<<META>>>
tags = [
- a
- b
]
`.trim();

    const result = parseLlmOutput(input);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.meta.tags).toEqual(["a", "b"]);
  });

  it("fails without META", () => {
    const input = `
# Title

Text
`.trim();

    const result = parseLlmOutput(input);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe("missing_meta_marker");
  });

  it("fails on multiple META", () => {
    const input = `
# Title

Text

<<<META>>>
a = b

<<<META>>>
`.trim();

    const result = parseLlmOutput(input);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe("multiple_meta_markers");
  });

  it("fails on empty note", () => {
    const input = `
<<<NOTE>>>

<<<META>>>
`.trim();

    const result = parseLlmOutput(input);

    expect(result.ok).toBe(false);
  });

  it("fails on invalid meta line", () => {
    const input = `
# Title

Text

<<<META>>>
invalid line
`.trim();

    const result = parseLlmOutput(input);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe("invalid_meta_line");
  });

  it("fails on broken array", () => {
    const input = `
# Title

Text

<<<META>>>
tags = [
- a
- b
`.trim();

    const result = parseLlmOutput(input);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe("unclosed_array");
  });
});
