"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Badge, Button, Card, Container, EmptyState } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getMessagingMessages } from "@/i18n/messaging-messages";
import { markAllNotificationsRead, markNotificationRead } from "@/server/messaging/actions";
import type { MessagingResult, NotificationRecord } from "@/server/messaging/types";
import { createSupabaseBrowserClient } from "@/supabase/browser";

export function NotificationsView({
  locale,
  initial,
}: {
  locale: Locale;
  initial: MessagingResult<NotificationRecord[]>;
}) {
  const messages = getMessagingMessages(locale);
  const router = useRouter();
  const [items, setItems] = useState(initial.status === "ok" ? initial.data : []);
  const [status, setStatus] = useState(initial.status === "error" ? messages.failed : null);
  const [isPending, startTransition] = useTransition();
  const [prevInitial, setPrevInitial] = useState(initial);

  if (prevInitial !== initial) {
    setPrevInitial(initial);
    if (initial.status === "ok") {
      setItems(initial.data);
      setStatus(null);
    } else if (initial.status === "error") {
      setStatus(messages.failed);
    }
  }

  useEffect(() => {
    try {
      const client = createSupabaseBrowserClient();
      const channel = client
        .channel("notifications:viewer")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          () => {
            router.refresh();
          },
        )
        .subscribe();
      return () => {
        void client.removeChannel(channel);
      };
    } catch {
      return undefined;
    }
  }, [router]);

  const unreadCount = items.reduce((count, item) => (item.readAt ? count : count + 1), 0);

  function targetLabel(kind: string): string {
    if (kind === "follow") return messages.viewProfile;
    if (kind === "message") return messages.start;
    if (kind === "group") return messages.openGroup;
    if (kind === "like" || kind === "comment" || kind === "share") return messages.openPost;
    return messages.view;
  }

  function read(id: string) {
    startTransition(() => {
      void markNotificationRead(id).then((result) => {
        if (!result.ok) {
          setStatus(messages.failed);
          return;
        }
        setItems((current) =>
          current.map((item) =>
            item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
          ),
        );
      });
    });
  }

  function readAll() {
    startTransition(() => {
      void markAllNotificationsRead().then((result) => {
        if (!result.ok) {
          setStatus(messages.failed);
          return;
        }
        setItems((current) =>
          current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
        );
      });
    });
  }

  return (
    <main className="notifications-page" data-locale={locale}>
      <Container size="md">
        <div className="platform-page__header">
          <div>
            <p className="showcase-eyebrow">XOWAAK / NOTIFICATIONS</p>
            <h1 className="ds-text-h1">{messages.title}</h1>
          </div>
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={isPending}
              isDisabled={isPending}
              onPress={readAll}
            >
              {messages.markAllRead}
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <EmptyState title={messages.notificationsEmpty} description={messages.failed} />
        ) : (
          <div className="notifications-list">
            {items.map((item) => (
              <Card
                key={item.id}
                className={item.readAt ? "notification-card" : "notification-card is-unread"}
              >
                <div>
                  <Badge variant={item.readAt ? "neutral" : "primary"}>{item.kind}</Badge>
                  <h2>{item.title}</h2>
                  {item.body && <p>{item.body}</p>}
                  <time dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleString(locale)}
                  </time>
                </div>
                <div className="notification-card__actions">
                  {item.targetPath && (
                    <Link href={`/${locale}${item.targetPath}` as Route}>
                      {targetLabel(item.kind)}
                    </Link>
                  )}
                  {!item.readAt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      loading={isPending}
                      onPress={() => read(item.id)}
                    >
                      {messages.markRead}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
        {status && <p role="alert">{status}</p>}
      </Container>
    </main>
  );
}
