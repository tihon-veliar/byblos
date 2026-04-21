import { describe, expect, it } from "vitest";
import { sanitizeNoteFileStem } from "./normalize";

describe("sanitizeNoteFileStem", () => {
  it("keeps human-readable unicode titles while removing filesystem-illegal characters", () => {
    expect(sanitizeNoteFileStem("Харконин: старейшина / Хацберг?")).toBe(
      "Харконин - старейшина - Хацберг",
    );
  });

  it("guards against Windows reserved device names", () => {
    expect(sanitizeNoteFileStem("AUX")).toBe("AUX note");
  });
});
