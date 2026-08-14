"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button, Card, Container, EmptyState, Input, Stack } from "@/design-system";
import { cx } from "@/design-system/utils/cx";
import type { Locale } from "@/config/locales";
import { getMessagingMessages } from "@/i18n/messaging-messages";
import { MediaUpload } from "@/features/media/media-upload";
import { EmojiPicker } from "@/features/messaging/emoji-picker";
import { createSupabaseBrowserClient } from "@/supabase/browser";
import {
  deleteDirectMessage,
  leaveConversation,
  loadConversation,
  markConversationRead,
  sendDirectMessage,
  setConversationMuted,
  startConversation,
} from "@/server/messaging/actions";
import { blockUser } from "@/server/social/actions";
import type {
  ConversationDetail,
  ConversationSummary,
  MessagingResult,
} from "@/server/messaging/types";

function shortDate(value: string | null, locale: Locale) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

export function MessagesView({
  locale,
  initial,
  initialUsername,
}: {
  locale: Locale;
  initial: MessagingResult<ConversationSummary[]>;
  initialUsername?: string;
}) {
  const messages = getMessagingMessages(locale);
  const conversations = initial.status === "ok" ? initial.data : [];
  const [items, setItems] = useState(conversations);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [username, setUsername] = useState("");
  const [body, setBody] = useState("");
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(
    initial.status === "error" ? messages.failed : null,
  );
  const [isPending, startTransition] = useTransition();
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [confirmLeave, setConfirmLeave] = useState(false);

  function clearUnread(id: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, unreadCount: 0 } : item)),
    );
  }

  function markRead(id: string) {
    clearUnread(id);
    startTransition(() => {
      void markConversationRead({ conversationId: id });
    });
  }

  useEffect(() => {
    if (!initialUsername) {
      return;
    }
    startTransition(() => {
      void startConversation({ username: initialUsername }).then((result) => {
        if (!result.ok) {
          setStatus(messages.failed);
          return;
        }
        void loadConversation(result.data.id).then((loaded) => {
          if (loaded.status !== "ok" || !loaded.data) {
            setStatus(messages.failed);
            return;
          }
          const summary: ConversationSummary = {
            id: loaded.data.id,
            otherUserId: loaded.data.otherUserId,
            otherUsername: loaded.data.otherUsername,
            otherDisplayName: loaded.data.otherDisplayName,
            otherAvatarUrl: loaded.data.otherAvatarUrl,
            lastMessage: loaded.data.messages.at(-1)?.body ?? null,
            lastMessageAt: loaded.data.messages.at(-1)?.createdAt ?? null,
            unreadCount: 0,
            muted: loaded.data.muted,
          };
          setItems((current) => [summary, ...current.filter((item) => item.id !== summary.id)]);
          setSelectedId(summary.id);
          setDetail(loaded.data);
          setStatus(null);
        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    void loadConversation(selectedId).then((result) => {
      if (active && result.status === "ok") {
        markRead(selectedId);
        setDetail(result.data);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function selectConversation(id: string) {
    markRead(id);
    setDetail(null);
    setSelectedId(id);
    setMobileView("thread");
  }

  useEffect(() => {
    if (!selectedId) return;
    let client: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    try {
      client = createSupabaseBrowserClient();
      const channel = client
        .channel(`messages:${selectedId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${selectedId}`,
          },
          () => {
            markRead(selectedId);
            void loadConversation(selectedId).then((result) => {
              if (result.status === "ok") setDetail(result.data);
            });
          },
        )
        .subscribe();
      return () => {
        void client?.removeChannel(channel);
      };
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function startChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      void startConversation({ username }).then(async (result) => {
        if (!result.ok) {
          setStatus(messages.failed);
          return;
        }
        const loaded = await loadConversation(result.data.id);
        if (loaded.status !== "ok" || !loaded.data) {
          setStatus(messages.failed);
          return;
        }
        const summary: ConversationSummary = {
          id: loaded.data.id,
          otherUserId: loaded.data.otherUserId,
          otherUsername: loaded.data.otherUsername,
          otherDisplayName: loaded.data.otherDisplayName,
          otherAvatarUrl: loaded.data.otherAvatarUrl,
          lastMessage: loaded.data.messages.at(-1)?.body ?? null,
          lastMessageAt: loaded.data.messages.at(-1)?.createdAt ?? null,
          unreadCount: 0,
          muted: loaded.data.muted,
        };
        setItems((current) => [summary, ...current.filter((item) => item.id !== summary.id)]);
        setUsername("");
        setSelectedId(summary.id);
        setDetail(loaded.data);
        setStatus(null);
      });
    });
  }

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || !body.trim()) return;
    startTransition(() => {
      void sendDirectMessage({ conversationId: selectedId, body, mediaAssetId }).then((result) => {
        if (!result.ok) {
          setStatus(messages.failed);
          return;
        }
        setBody("");
        setMediaAssetId(null);
        void loadConversation(selectedId).then((loaded) => {
          if (loaded.status === "ok") setDetail(loaded.data);
        });
      });
    });
  }

  function removeMessage(messageId: string) {
    if (!selectedId) return;
    startTransition(() => {
      void deleteDirectMessage({ messageId }).then((result) => {
        if (!result.ok) {
          setStatus(messages.failed);
          return;
        }
        void loadConversation(selectedId).then((loaded) => {
          if (loaded.status === "ok") setDetail(loaded.data);
        });
      });
    });
  }

  function toggleMuted() {
    if (!selectedId || !detail) return;
    setStatus(null);
    startTransition(() => {
      void setConversationMuted({ conversationId: selectedId, muted: !detail.muted }).then(
        (result) => {
          if (!result.ok) {
            setStatus(messages.failed);
            return;
          }
          setDetail((current) =>
            current ? { ...current, muted: !current.muted } : current,
          );
          setItems((current) =>
            current.map((item) =>
              item.id === selectedId ? { ...item, muted: !detail.muted } : item,
            ),
          );
        },
      );
    });
  }

  function block() {
    if (!selectedId || !detail) return;
    setStatus(null);
    startTransition(() => {
      void blockUser({ userId: detail.otherUserId }).then((result) => {
        if (!result.ok) {
          setStatus(messages.failed);
          return;
        }
        void leaveConversation({ conversationId: selectedId }).then((response) => {
          if (!response.ok) {
            setStatus(messages.failed);
            return;
          }
          setItems((current) => current.filter((item) => item.id !== selectedId));
          setDetail(null);
          setSelectedId(items.find((item) => item.id !== selectedId)?.id ?? null);
          setConfirmLeave(false);
        });
      });
    });
  }

  function leave() {
    if (!selectedId) return;
    setStatus(null);
    startTransition(() => {
      void leaveConversation({ conversationId: selectedId }).then((result) => {
        if (!result.ok) {
          setStatus(messages.failed);
          return;
        }
        setItems((current) => current.filter((item) => item.id !== selectedId));
        setDetail(null);
        setSelectedId(items.find((item) => item.id !== selectedId)?.id ?? null);
        setConfirmLeave(false);
      });
    });
  }

  const filtered = items.filter((item) => {
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return (
      item.otherDisplayName.toLowerCase().includes(needle) ||
      item.otherUsername.toLowerCase().includes(needle)
    );
  });

  return (
    <main className="messaging-page" data-locale={locale}>
      <Container size="xl">
        <div className="messaging-page__header">
          <div>
            <p className="showcase-eyebrow">XOWAAK / MESSAGES</p>
            <h1 className="ds-text-h1">{messages.conversations}</h1>
          </div>
          <form onSubmit={startChat} className="messaging-start-form">
            <Input
              label={messages.usernamePlaceholder}
              value={username}
              onChange={setUsername}
              isDisabled={isPending}
              inputProps={{ name: "username", autoComplete: "off" }}
            />
            <Button
              type="submit"
              size="sm"
              loading={isPending}
              isDisabled={isPending || !username.trim()}
            >
              {messages.start}
            </Button>
          </form>
        </div>
        <div className="messaging-layout" data-mobile-view={mobileView}>
          <Card className="messaging-list">
            <div className="messaging-list__heading">
              <h2>{messages.conversations}</h2>
              <Input
                label={messages.search}
                value={query}
                onChange={setQuery}
                inputProps={{ name: "search", autoComplete: "off" }}
              />
            </div>
            {filtered.length === 0 ? (
              <EmptyState title={messages.noConversations} description={messages.startTitle} />
            ) : (
              <div className="messaging-list__items">
                {filtered.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={cx(
                      "messaging-list__item",
                      selectedId === item.id && "is-selected",
                    )}
                    onClick={() => selectConversation(item.id)}
                  >
                    <span className="messaging-list__avatar" aria-hidden="true">
                      {item.otherAvatarUrl ? (
                        // Signed URLs are generated on the server for conversation members.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.otherAvatarUrl} alt="" loading="lazy" decoding="async" />
                      ) : (
                        item.otherDisplayName.slice(0, 1).toUpperCase()
                      )}
                    </span>
                    <span className="messaging-list__body">
                      <span className="messaging-list__row">
                        <strong>
                          {item.otherDisplayName}
                          {item.muted && (
                            <span className="messaging-list__muted" aria-label={messages.mute}>
                              <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 8.5v3h2.5L10 15V5L6.5 8.5H4Z" />
                                <path d="M13 8l4 4M17 8l-4 4" />
                              </svg>
                            </span>
                          )}
                        </strong>
                        {shortDate(item.lastMessageAt, locale) && (
                          <time dateTime={item.lastMessageAt ?? undefined}>
                            {shortDate(item.lastMessageAt, locale)}
                          </time>
                        )}
                      </span>
                      <span className="messaging-list__username">
                        @{item.otherUsername}
                      </span>
                      {item.lastMessage && <small>{item.lastMessage}</small>}
                    </span>
                    {item.unreadCount > 0 && (
                      <span className="messaging-list__unread">{item.unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </Card>
          <Card className="messaging-thread">
            {detail ? (
              <>
                <header className="messaging-thread__header">
                  <button
                    type="button"
                    className="messaging-thread__back"
                    onClick={() => setMobileView("list")}
                    aria-label={messages.back}
                  >
                    ←
                  </button>
                  <Link
                    className="messaging-thread__identity"
                    href={`/${locale}/u/${detail.otherUsername}` as Route}
                  >
                    {detail.otherAvatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="messaging-thread__avatar"
                        src={detail.otherAvatarUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span>
                      <strong>{detail.otherDisplayName}</strong>
                      <span>@{detail.otherUsername}</span>
                    </span>
                  </Link>
                  <div className="messaging-thread__actions">
                    <Link
                      className="messaging-thread__action"
                      href={`/${locale}/u/${detail.otherUsername}` as Route}
                    >
                      {messages.viewProfile}
                    </Link>
                    <button
                      type="button"
                      className="messaging-thread__action"
                      onClick={toggleMuted}
                      disabled={isPending}
                    >
                      {detail.muted ? messages.unmute : messages.mute}
                    </button>
                    <button
                      type="button"
                      className="messaging-thread__action"
                      onClick={block}
                      disabled={isPending}
                    >
                      {messages.block}
                    </button>
                    <button
                      type="button"
                      className="messaging-thread__action"
                      onClick={() => setConfirmLeave(true)}
                      disabled={isPending}
                    >
                      {messages.leave}
                    </button>
                  </div>
                </header>
                {confirmLeave && (
                  <div className="messaging-thread__confirm">
                    <p>{messages.leaveConfirm}</p>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      loading={isPending}
                      isDisabled={isPending}
                      onPress={leave}
                    >
                      {messages.leave}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onPress={() => setConfirmLeave(false)}
                    >
                      {messages.decline}
                    </Button>
                  </div>
                )}
                <div className="messaging-thread__messages" aria-live="polite">
                  {detail.messages.length === 0 ? (
                    <p>{messages.noMessages}</p>
                  ) : (
                    detail.messages.map((message) => (
                      <article
                        key={message.id}
                        className={cx(
                          "messaging-message",
                          message.senderId === detail.otherUserId
                            ? "messaging-message--other"
                            : "messaging-message--own",
                        )}
                      >
                        <p dir="auto">{message.body}</p>
                        {message.mediaUrl && (
                          // Signed URLs are generated on the server for conversation members.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={message.mediaUrl} alt="" />
                        )}
                        <time dateTime={message.createdAt}>
                          {new Date(message.createdAt).toLocaleString(locale)}
                        </time>
                        {message.senderId !== detail.otherUserId && (
                          <button
                            type="button"
                            className="messaging-message__delete"
                            onClick={() => removeMessage(message.id)}
                            disabled={isPending}
                            aria-label={messages.deleteMessage}
                          >
                            <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                              <path d="M5 5l10 10M15 5 5 15" />
                            </svg>
                          </button>
                        )}
                      </article>
                    ))
                  )}
                </div>
                <form onSubmit={send} className="messaging-composer">
                  <Stack gap={3}>
                    <Input
                      label={messages.messagePlaceholder}
                      value={body}
                      onChange={setBody}
                      isDisabled={isPending}
                      inputProps={{ name: "body", autoComplete: "off" }}
                    />
                    <div className="messaging-composer__tools">
                      <EmojiPicker locale={locale} onSelect={(emoji) => setBody((v) => v + emoji)} />
                      <MediaUpload
                        locale={locale}
                        bucket="message-media"
                        label={messages.attachment}
                        uploadLabel={messages.attachment}
                        failedLabel={messages.failed}
                        accept="image/*,video/*"
                        multiple={false}
                        maxFiles={1}
                        disabled={isPending}
                        onAssetIdsChange={(ids) => setMediaAssetId(ids[0] ?? null)}
                      />
                      <Button
                        type="submit"
                        loading={isPending}
                        isDisabled={isPending || !body.trim()}
                      >
                        {messages.send}
                      </Button>
                    </div>
                  </Stack>
                </form>
              </>
            ) : (
              <EmptyState title={messages.noMessages} description={messages.startTitle} />
            )}
            {status && <p role="alert">{status}</p>}
          </Card>
        </div>
      </Container>
    </main>
  );
}