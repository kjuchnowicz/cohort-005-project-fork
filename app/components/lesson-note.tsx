import { useState } from "react";
import { useFetcher } from "react-router";
import { Lock, NotebookPen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { cn, formatRelativeTime } from "~/lib/utils";
import { MAX_NOTE_LENGTH } from "~/lib/notes";
import { describeNoteDraft } from "~/modules/lesson-notes";

// Shares its frame with CommentThread (card padding, heading, footer) so the
// two writing surfaces on the lesson page read as one family.
export function LessonNote({
  note,
}: {
  note: { body: string; updatedAt: string } | null;
}) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const savedBody = note?.body ?? "";
  const [body, setBody] = useState(savedBody);
  const isSaving = fetcher.state !== "idle";
  const error = fetcher.data?.error;
  const draft = describeNoteDraft(body, savedBody, MAX_NOTE_LENGTH);

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <LessonNoteHeader />

        <fetcher.Form method="post" className="space-y-2">
          <input type="hidden" name="intent" value="save-note" />
          <Textarea
            name="body"
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Jot down what you want to remember from this lesson..."
            aria-label="Your notes"
            className="resize-y"
          />
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !draft.canSave}
            >
              {isSaving ? "Saving..." : "Save note"}
            </Button>
            <NoteStatus
              error={error}
              dirty={draft.dirty}
              updatedAt={note?.updatedAt}
            />
            <NoteLength length={draft.length} tooLong={draft.tooLong} />
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

function NoteStatus({
  error,
  dirty,
  updatedAt,
}: {
  error: string | undefined;
  dirty: boolean;
  updatedAt: string | undefined;
}) {
  if (error) return <span className="text-xs text-destructive">{error}</span>;
  if (dirty)
    return (
      <span className="text-xs text-muted-foreground">Unsaved changes</span>
    );
  if (!updatedAt) return null;
  return (
    <span suppressHydrationWarning className="text-xs text-muted-foreground">
      Saved {formatRelativeTime(updatedAt)}
    </span>
  );
}

function LessonNoteHeader() {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <NotebookPen className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Your notes</h2>
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Lock className="size-3" />
        Only you can see these
      </span>
    </div>
  );
}

function NoteLength({ length, tooLong }: { length: number; tooLong: boolean }) {
  return (
    <span
      className={cn(
        "ml-auto text-xs",
        tooLong ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {length} / {MAX_NOTE_LENGTH}
    </span>
  );
}
