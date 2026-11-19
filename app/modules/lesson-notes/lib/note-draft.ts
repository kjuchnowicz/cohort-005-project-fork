export type NoteDraft = {
  length: number;
  tooLong: boolean;
  dirty: boolean;
  canSave: boolean;
};

/**
 * What the note editor shows for the text in the box: the character count,
 * whether it is over the limit, whether it differs from the saved note, and
 * whether Save should be enabled.
 */
export function describeNoteDraft(
  draft: string,
  savedBody: string,
  maxLength: number
): NoteDraft {
  // The server trims before it checks the limit and stores the note, so the
  // editor judges the same trimmed text it would send.
  const body = draft.trim();
  const tooLong = body.length > maxLength;
  const dirty = body !== savedBody;
  return {
    length: body.length,
    tooLong,
    dirty,
    canSave: dirty && body.length > 0 && !tooLong,
  };
}
