"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button, EmptyState, Input, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { sendGroupMessage } from "@/server/platform/actions";
import { createSupabaseBrowserClient } from "@/supabase/browser";
import type { GroupMessageRecord, PlatformResult } from "@/server/platform/types";

export function GroupChat({
  locale,
  groupId,
  result,
}: {
  locale: Locale;
  groupId: string;
  result: PlatformResult<GroupMessageRecord[]>;
}) {
  const app = getAppMessages(locale);
  const router = useRouter();
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const client = createSupabaseBrowserClient();
      const channel = client
        .channel(`group-messages:${groupId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "group_messages",
            filter: `group_id=eq.${groupId}`,
          },
          () => router.refresh(),
        )
        .subscribe();
      return () => {
        void client.removeChannel(channel);
      };
    } catch {
      return undefined;
    }
  }, [groupId, router]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    startTransition(() => {
      void sendGroupMessage({ groupId, body }).then((response) => {
        if (!response.ok) {
          setStatus(app.unavailable);
          return;
        }
        setBody("");
        router.refresh();
      });
    });
  }

  return (
    <section className="group-chat" aria-labelledby="group-chat-title">
      <div className="group-chat__heading">
        <h2 id="group-chat-title">{app.groupsTitle}</h2>
        <span>{result.status === "ok" ? app.current : app.unavailable}</span>
      </div>
      {result.status === "ok" && result.data.length === 0 && (
        <EmptyState title={app.emptyContent} description={app.createUnavailable} />
      )}
      {result.status === "ok" && result.data.length > 0 && (
        <div className="group-chat__messages">
          {result.data.map((message) => (
            <article key={message.id}>
              <p>{message.body}</p>
              <time dateTime={message.createdAt}>
                {new Date(message.createdAt).toLocaleString(locale)}
              </time>
            </article>
          ))}
        </div>
      )}
      <form className="group-chat__composer" onSubmit={submit}>
        <Stack gap={3}>
          <Input
            label={app.groupChatPlaceholder}
            value={body}
            onChange={setBody}
            inputProps={{ name: "body", autoComplete: "off" }}
          />
          <Button type="submit" loading={isPending} isDisabled={isPending || !body.trim()}>
            {app.sendMessage}
          </Button>
          {status && <p role="alert">{status}</p>}
        </Stack>
      </form>
    </section>
  );
}
