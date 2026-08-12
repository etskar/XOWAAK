"use client";

import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button, Card, Container, EmptyState, Input, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getMessagingMessages } from "@/i18n/messaging-messages";
import { MediaUpload } from "@/features/media/media-upload";
import { createSupabaseBrowserClient } from "@/supabase/browser";
import { loadConversation, sendDirectMessage, startConversation } from "@/server/messaging/actions";
import type {
  ConversationDetail,
  ConversationSummary,
  MessagingResult,
} from "@/server/messaging/types";

export function MessagesView({
  locale,
  initial,
}: {
  locale: Locale;
  initial: MessagingResult<ConversationSummary[]>;
}) {
  const messages = getMessagingMessages(locale);
  const conversations = initial.status === "ok" ? initial.data : [];
  const [items, setItems] = useState(conversations);
  const [selectedId, setSelectedId] = useState<string | null>(conversations[0]?.id ?? null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [username, setUsername] = useState("");
  const [body, setBody] = useState("");
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(
    initial.status === "error" ? messages.failed : null,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    void loadConversation(selectedId).then((result) => {
      if (active && result.status === "ok") setDetail(result.data);
    });
    return () => {
      active = false;
    };
  }, [selectedId]);

  function selectConversation(id: string) {
    setDetail(null);
    setSelectedId(id);
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
          lastMessage: loaded.data.messages.at(-1)?.body ?? null,
          lastMessageAt: loaded.data.messages.at(-1)?.createdAt ?? null,
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
        <div className="messaging-layout">
          <Card className="messaging-list">
            <h2>{messages.conversations}</h2>
            {items.length === 0 ? (
              <EmptyState title={messages.noConversations} description={messages.startTitle} />
            ) : (
              <div className="messaging-list__items">
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={
                      selectedId === item.id
                        ? "messaging-list__item is-selected"
                        : "messaging-list__item"
                    }
                    onClick={() => selectConversation(item.id)}
                  >
                    <strong>{item.otherDisplayName}</strong>
                    <span>@{item.otherUsername}</span>
                    {item.lastMessage && <small>{item.lastMessage}</small>}
                  </button>
                ))}
              </div>
            )}
          </Card>
          <Card className="messaging-thread">
            {detail ? (
              <>
                <header className="messaging-thread__header">
                  <h2>{detail.otherDisplayName}</h2>
                  <span>@{detail.otherUsername}</span>
                </header>
                <div className="messaging-thread__messages" aria-live="polite">
                  {detail.messages.length === 0 ? (
                    <p>{messages.noMessages}</p>
                  ) : (
                    detail.messages.map((message) => (
                      <article key={message.id} className="messaging-message">
                        <p dir="auto">{message.body}</p>
                        {message.mediaUrl && (
                          // Signed URLs are generated on the server for conversation members.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={message.mediaUrl} alt="" />
                        )}
                        <time dateTime={message.createdAt}>
                          {new Date(message.createdAt).toLocaleString(locale)}
                        </time>
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
