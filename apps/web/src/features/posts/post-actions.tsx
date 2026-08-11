"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Dialog, Select, Stack, Textarea } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getPostsMessages } from "@/i18n/posts-messages";
import { createTranslator } from "@/i18n/translate";
import { deletePost, updatePost } from "@/server/posts/actions";
import type { PostRecord } from "@/server/posts/types";

type PostActionsProps = {
  locale: Locale;
  post: PostRecord;
  isOwner: boolean;
};

export function PostActions({ locale, post, isOwner }: PostActionsProps) {
  const router = useRouter();
  const messages = getPostsMessages(locale);
  const { t } = createTranslator(locale);
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState(post.content ?? "");
  const [visibility, setVisibility] = useState(post.visibility);
  const [status, setStatus] = useState<string | null>(null);

  if (!isOwner) return null;

  function saveEdit() {
    startTransition(() => {
      void (async () => {
        const result = await updatePost({ id: post.id, content, visibility });
        setStatus(result.ok ? messages.card.updated : messages.card.editUnavailable);
        if (result.ok) router.refresh();
      })();
    });
  }

  function remove() {
    startTransition(() => {
      void (async () => {
        const result = await deletePost({ id: post.id });
        setStatus(result.ok ? messages.card.deleted : messages.pages.failed);
        if (result.ok) router.refresh();
      })();
    });
  }

  return (
    <div className="post-actions">
      <Dialog
        trigger={
          <Button type="button" variant="ghost">
            {messages.card.edit}
          </Button>
        }
        title={messages.card.edit}
        closeLabel={messages.confirmation.cancel}
      >
        <Stack gap={4}>
          <Textarea label={messages.composer.title} value={content} onChange={setContent} />
          <Select
            label={messages.composer.visibility}
            options={[
              { id: "public", label: messages.composer.public },
              { id: "followers", label: messages.composer.followers },
              { id: "private", label: messages.composer.private },
            ]}
            selectedKey={visibility}
            onSelectionChange={(key) => setVisibility(String(key) as PostRecord["visibility"])}
          />
          <Button type="button" loading={isPending} isDisabled={isPending} onPress={saveEdit}>
            {t("common.save")}
          </Button>
        </Stack>
      </Dialog>
      <Dialog
        trigger={
          <Button type="button" variant="destructive">
            {messages.card.delete}
          </Button>
        }
        title={messages.confirmation.deleteTitle}
        closeLabel={messages.confirmation.cancel}
      >
        <Stack gap={4}>
          <p>{messages.confirmation.deleteDescription}</p>
          <Button
            type="button"
            variant="destructive"
            loading={isPending}
            isDisabled={isPending}
            onPress={remove}
          >
            {messages.confirmation.confirmDelete}
          </Button>
        </Stack>
      </Dialog>
      {status && (
        <span className="post-action-status" role="status">
          {status}
        </span>
      )}
    </div>
  );
}
