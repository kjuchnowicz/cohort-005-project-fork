import { type Markdown } from "~/lib/text";

type CommentAuthor = {
  id: number;
  name: string;
  avatarUrl: string | null;
  isInstructor: boolean;
  isPlatformAdmin: boolean;
};

export type ThreadComment = {
  id: number;
  body: Markdown;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  author: CommentAuthor;
  replies: ThreadComment[];
};
