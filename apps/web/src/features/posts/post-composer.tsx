"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { isPostPublishable, postSchema } from "@/domains/posts/validation";
import { Button, Select, Stack, Textarea } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getPostsMessages } from "@/i18n/posts-messages";
import { createPost } from "@/server/posts/actions";

type PostComposerProps = {
  locale: Locale;
  unavailable: boolean;
};

export function PostComposer({ locale, unavailable }: PostComposerProps) {
  const router = useRouter();
  const messages = getPostsMessages(locale);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
  const [status, setStatus] = useState<string | null>(
    unavailable ? messages.pages.unavailable : null,
  );
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = postSchema.safeParse({
      content,
      visibility,
      mediaAssetIds: [],
      status: "published",
    });

    if (!parsed.success || !isPostPublishable(content, [])) {
      setStatus(content.length > 5000 ? messages.validation.tooLong : messages.validation.empty);
      return;
    }

    startTransition(() => {
      void (async () => {
        const result = await createPost(parsed.data);
        if (!result.ok) {
          setStatus(
            result.code === "unavailable" ? messages.pages.unavailable : messages.pages.failed,
          );
          return;
        }
        setContent("");
        setStatus(messages.composer.created);
        router.refresh();
      })();
    });
  }

  return (
    <form className="post-composer" onSubmit={submit}>
      <Stack gap={4}>
        <h2 className="settings-section-title">{messages.composer.title}</h2>
        <Textarea
          label={messages.composer.title}
          placeholder={messages.composer.placeholder}
          value={content}
          onChange={setContent}
          isDisabled={unavailable || isPending}
          textareaClassName="post-composer__textarea"
        />
        <Select
          label={messages.composer.visibility}
          options={[
            { id: "public", label: messages.composer.public },
            { id: "followers", label: messages.composer.followers },
            { id: "private", label: messages.composer.private },
          ]}
          selectedKey={visibility}
          onSelectionChange={(key) =>
            setVisibility(String(key) as "public" | "followers" | "private")
          }
          isDisabled={unavailable || isPending}
        />
        <Button type="submit" loading={isPending} isDisabled={unavailable || isPending}>
          {messages.composer.submit}
        </Button>
        {status && (
          <p
            className="post-status"
            role={status === messages.composer.created ? "status" : "alert"}
          >
            {status}
          </p>
        )}
      </Stack>
    </form>
  );
}
