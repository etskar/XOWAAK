"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button, Input, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getPostsMessages } from "@/i18n/posts-messages";
import { formatDateTime } from "@/i18n/format";
import { createTranslator } from "@/i18n/translate";
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
  showComments = true,
  isAuthenticated = true,
}: {
  locale: Locale;
  postId: string;
  initial?: PostEngagement;
  showComments?: boolean;
  isAuthenticated?: boolean;
}) {
  const messages = getPostsMessages(locale);
  const { t } = createTranslator(locale);
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
              authorUsername: "self",
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
        {!isAuthenticated ? (
          <>
            <span className="post-engagement__count">
              {messages.engagement.like} ({engagement.likeCount})
            </span>
            <span className="post-engagement__count" aria-label={messages.engagement.comments}>
              {messages.engagement.comment} ({engagement.commentCount})
            </span>
            <span className="post-engagement__count">
              {messages.engagement.share} ({engagement.shareCount})
            </span>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
      {showComments && (
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
                <article key={item.id} className="post-comment">
                  <span className="post-comment__avatar" aria-hidden="true">
                    {item.authorName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="post-comment__body">
                    <div className="post-comment__meta">
                      <strong>{item.authorName}</strong>
                      {item.authorUsername !== "self" && (
                        <span>@{item.authorUsername}</span>
                      )}
                      <time dateTime={item.createdAt}>
                        {formatDateTime(item.createdAt, locale)}
                      </time>
                    </div>
                    <p dir="auto">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!isAuthenticated ? (
            <Link
              className="post-engagement__signin"
              href={`/${locale}/auth/sign-in?next=${encodeURIComponent(window.location.pathname)}`}
            >
              {t("navigation.signIn")}
            </Link>
          ) : (
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
          )}
          {status && <p role="alert">{status}</p>}
        </Stack>
        </details>
      )}
    </div>
  );
}
