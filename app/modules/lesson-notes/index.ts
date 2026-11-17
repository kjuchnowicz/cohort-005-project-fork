import { describeDraft, type NoteDraft } from "./lib/note-draft";

export type { NoteDraft };

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
  return describeDraft(draft, savedBody, maxLength);
}
