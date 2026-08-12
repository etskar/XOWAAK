"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button, Input, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getPostsMessages } from "@/i18n/posts-messages";
import {
  addPostComment,
  togglePostLike,
  togglePostShare,
} from "@/server/posts/interaction-actions";
import type { PostEngagement } from "@/server/posts/types";

export function PostEngagement({
  locale,
  postId,
  initial,
}: {
  locale: Locale;
  postId: string;
  initial?: PostEngagement;
}) {
  const messages = getPostsMessages(locale);
  const empty: PostEngagement = {
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    viewerLiked: false,
    viewerShared: false,
    comments: [],
  };
  const [engagement, setEngagement] = useState(initial ?? empty);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function like() {
    startTransition(() => {
      void togglePostLike({ postId }).then((result) => {
        if (!result.ok) {
          setStatus(messages.engagement.actionFailed);
          return;
        }
        setEngagement((current) => ({
          ...current,
          viewerLiked: result.data.active,
          likeCount: current.likeCount + (result.data.active ? 1 : -1),
        }));
      });
    });
  }

  function share() {
    startTransition(() => {
      void togglePostShare({ postId }).then((result) => {
        if (!result.ok) {
          setStatus(messages.engagement.actionFailed);
          return;
        }
        setEngagement((current) => ({
          ...current,
          viewerShared: result.data.active,
          shareCount: current.shareCount + (result.data.active ? 1 : -1),
        }));
      });
    });
  }

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) return;
    startTransition(() => {
      void addPostComment({ postId, body: comment }).then((result) => {
        if (!result.ok) {
          setStatus(messages.engagement.actionFailed);
          return;
        }
        setComment("");
        setEngagement((current) => ({
          ...current,
          commentCount: current.commentCount + 1,
          comments: [
            ...current.comments,
            {
              id: result.data.id,
              authorId: "self",
              authorName: messages.engagement.you,
              body: comment,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      });
    });
  }

  return (
    <div className="post-engagement">
      <div className="post-engagement__actions">
        <Button
          type="button"
          size="sm"
          variant={engagement.viewerLiked ? "secondary" : "ghost"}
          onPress={like}
          isDisabled={isPending}
        >
          {engagement.viewerLiked ? messages.engagement.liked : messages.engagement.like} (
          {engagement.likeCount})
        </Button>
        <span className="post-engagement__count" aria-label={messages.engagement.comments}>
          {messages.engagement.comment} ({engagement.commentCount})
        </span>
        <Button
          type="button"
          size="sm"
          variant={engagement.viewerShared ? "secondary" : "ghost"}
          onPress={share}
          isDisabled={isPending}
        >
          {engagement.viewerShared ? messages.engagement.shared : messages.engagement.share} (
          {engagement.shareCount})
        </Button>
      </div>
      <details className="post-engagement__comments">
        <summary>
          {messages.engagement.comments} ({engagement.commentCount})
        </summary>
        <Stack gap={3}>
          {engagement.comments.length === 0 ? (
            <p>{messages.engagement.emptyComments}</p>
          ) : (
            <div className="post-engagement__comment-list">
              {engagement.comments.map((item) => (
                <article key={item.id}>
                  <strong>{item.authorName}</strong>
                  <p dir="auto">{item.body}</p>
                </article>
              ))}
            </div>
          )}
          <form onSubmit={submitComment}>
            <Stack gap={2}>
              <Input
                label={messages.engagement.comment}
                placeholder={messages.engagement.writeComment}
                value={comment}
                onChange={setComment}
                isDisabled={isPending}
                inputProps={{ name: "comment", autoComplete: "off" }}
              />
              <Button
                type="submit"
                size="sm"
                loading={isPending}
                isDisabled={isPending || !comment.trim()}
              >
                {messages.engagement.submitComment}
              </Button>
            </Stack>
          </form>
          {status && <p role="alert">{status}</p>}
        </Stack>
      </details>
    </div>
  );
}
