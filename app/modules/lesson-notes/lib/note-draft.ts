export type NoteDraft = {
  length: number;
  tooLong: boolean;
  dirty: boolean;
  canSave: boolean;
};

export function describeDraft(
  draft: string,
  savedBody: string,
  maxLength: number
): NoteDraft {
  const tooLong = draft.length > maxLength;
  const empty = draft.trim().length === 0;
  const dirty = draft !== savedBody;
  return {
    length: draft.length,
    tooLong,
    dirty,
    canSave: dirty && !empty && !tooLong,
  };
}
