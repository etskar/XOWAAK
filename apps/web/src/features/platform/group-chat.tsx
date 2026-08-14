"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button, EmptyState, Input, Stack } from "@/design-system";
import { cx } from "@/design-system/utils/cx";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { getMessagingMessages } from "@/i18n/messaging-messages";
import { deleteGroupMessage, sendGroupMessage } from "@/server/platform/actions";
import { MediaUpload } from "@/features/media/media-upload";
import { EmojiPicker } from "@/features/messaging/emoji-picker";
import { createSupabaseBrowserClient } from "@/supabase/browser";
import type { GroupMessageRecord, PlatformResult } from "@/server/platform/types";

type GroupChatProps = {
  locale: Locale;
  groupId: string;
  result: PlatformResult<GroupMessageRecord[]>;
  viewerId: string | null;
  isChannel: boolean;
  viewerCanManage: boolean;
};

export function GroupChat({
  locale,
  groupId,
  result,
  viewerId,
  isChannel,
  viewerCanManage,
}: GroupChatProps) {
  const app = getAppMessages(locale);
  const messages = getMessagingMessages(locale);
  const router = useRouter();
  const [body, setBody] = useState("");
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
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
      void sendGroupMessage({ groupId, body, mediaAssetId }).then((response) => {
        if (!response.ok) {
          setStatus(response.code === "forbidden" ? messages.channelPostingRestricted : app.unavailable);
          return;
        }
        setBody("");
        setMediaAssetId(null);
        router.refresh();
      });
    });
  }

  function removeMessage(messageId: string) {
    startTransition(() => {
      void deleteGroupMessage({ messageId }).then((response) => {
        if (!response.ok) {
          setStatus(app.unavailable);
          return;
        }
        router.refresh();
      });
    });
  }

  const messagesOk = result.status === "ok";

  return (
    <section className="group-chat" aria-labelledby="group-chat-title">
      <div className="group-chat__heading">
        <h2 id="group-chat-title">{app.groupsTitle}</h2>
        <span>{messagesOk ? app.current : app.unavailable}</span>
      </div>
      {messagesOk && result.data.length === 0 && (
        <EmptyState title={app.emptyContent} description={app.createUnavailable} />
      )}
      {messagesOk && result.data.length > 0 && (
        <div className="group-chat__messages">
          {result.data.map((message) => {
            const own = message.senderId === viewerId;
            const canDelete = own || viewerCanManage;
            return (
              <article
                key={message.id}
                className={cx(
                  "messaging-message",
                  own && "messaging-message--own",
                  message.deletedAt && "messaging-message--deleted",
                )}
              >
                {!own && message.senderUsername && (
                  <span className="messaging-message__sender">
                    {message.senderDisplayName || message.senderUsername}
                  </span>
                )}
                {message.mediaUrl && message.mediaType === "video" ? (
                  <video
                    className="messaging-message__media"
                    src={message.mediaUrl}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : message.mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="messaging-message__media"
                    src={message.mediaUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                {message.body && <p>{message.body}</p>}
                <time dateTime={message.createdAt}>
                  {new Date(message.createdAt).toLocaleString(locale)}
                </time>
                {canDelete && !message.deletedAt && (
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
            );
          })}
        </div>
      )}
      {isChannel && !viewerCanManage ? (
        <p className="group-chat__restricted">{messages.channelPostingRestricted}</p>
      ) : (
        <form className="group-chat__composer" onSubmit={submit}>
          <Stack gap={3}>
            <Input
              label={app.groupChatPlaceholder}
              value={body}
              onChange={setBody}
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
            <div className="messaging-composer__tools">
              <EmojiPicker locale={locale} onSelect={(emoji) => setBody((v) => v + emoji)} />
              <Button type="submit" loading={isPending} isDisabled={isPending || !body.trim()}>
                {app.sendMessage}
              </Button>
            </div>
            {status && <p role="alert">{status}</p>}
          </Stack>
        </form>
      )}
    </section>
  );
}