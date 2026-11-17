import { describe, it, expect } from "vitest";
import { describeNoteDraft } from "../index";

describe("describeNoteDraft", () => {
  it("cannot save an untouched empty note", () => {
    expect(describeNoteDraft("", "", 10)).toEqual({
      length: 0,
      tooLong: false,
      dirty: false,
      canSave: false,
    });
  });

  it("can save new text within the limit", () => {
    expect(describeNoteDraft("hello", "", 10)).toEqual({
      length: 5,
      tooLong: false,
      dirty: true,
      canSave: true,
    });
  });

  it("cannot save text that matches the saved note", () => {
    const draft = describeNoteDraft("hello", "hello", 10);
    expect(draft.dirty).toBe(false);
    expect(draft.canSave).toBe(false);
  });

  it("cannot save whitespace only, even when it differs", () => {
    const draft = describeNoteDraft("   ", "hello", 10);
    expect(draft.dirty).toBe(true);
    expect(draft.canSave).toBe(false);
  });

  it("allows exactly the limit", () => {
    const draft = describeNoteDraft("a".repeat(10), "", 10);
    expect(draft.tooLong).toBe(false);
    expect(draft.canSave).toBe(true);
  });

  it("refuses one character over the limit", () => {
    const draft = describeNoteDraft("a".repeat(11), "", 10);
    expect(draft).toEqual({
      length: 11,
      tooLong: true,
      dirty: true,
      canSave: false,
    });
  });
});
