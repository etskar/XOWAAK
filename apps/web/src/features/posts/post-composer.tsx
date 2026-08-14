"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { isPostPublishable, postSchema } from "@/domains/posts/validation";
import { Button, Select, Stack, Textarea } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getPostsMessages } from "@/i18n/posts-messages";
import { createTranslator } from "@/i18n/translate";
import { createPost } from "@/server/posts/actions";
import { MediaUpload } from "@/features/media/media-upload";

type PostComposerProps = {
  locale: Locale;
  unavailable: boolean;
  redirectTo?: Route;
};

export function PostComposer({ locale, unavailable, redirectTo }: PostComposerProps) {
  const router = useRouter();
  const messages = getPostsMessages(locale);
  const { t } = createTranslator(locale);
  const [content, setContent] = useState("");
  const [mediaAssetIds, setMediaAssetIds] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");
  const [stage, setStage] = useState<"edit" | "preview">("edit");
  const [status, setStatus] = useState<string | null>(
    unavailable ? messages.pages.unavailable : null,
  );
  const [isPending, startTransition] = useTransition();

  function validate() {
    const parsed = postSchema.safeParse({
      content,
      visibility,
      mediaAssetIds,
      status: "published",
    });
    if (!parsed.success || !isPostPublishable(content, mediaAssetIds)) {
      setStatus(content.length > 5000 ? messages.validation.tooLong : messages.validation.empty);
      return null;
    }
    return parsed.data;
  }

  function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validate()) {
      setStatus(null);
      setStage("preview");
    }
  }

  function publish() {
    const data = validate();
    if (!data) return;

    startTransition(() => {
      void (async () => {
        const result = await createPost(data);
        if (!result.ok) {
          setStatus(
            result.code === "unavailable" ? messages.pages.unavailable : messages.pages.failed,
          );
          return;
        }
        setContent("");
        setMediaAssetIds([]);
        setPreviews([]);
        setStage("edit");
        setStatus(messages.composer.created);
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      })();
    });
  }

  if (stage === "preview") {
    return (
      <div className="post-composer post-composer--preview" id="post-composer">
        <Stack gap={4}>
          <div className="post-composer__header">
            <div>
              <p className="showcase-eyebrow">{messages.composer.title}</p>
              <h2 className="settings-section-title">{t("common.next")}</h2>
            </div>
          </div>
          <article className="post-preview-card">
            {content && <p className="post-preview-card__content" dir="auto">{content}</p>}
            {previews.length > 0 && (
              <div className="post-preview-card__media">
                {previews.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" />
                ))}
              </div>
            )}
          </article>
          <div className="platform-form__actions">
            <Button
              variant="secondary"
              onPress={() => setStage("edit")}
              isDisabled={isPending}
            >
              {messages.composer.backToEdit}
            </Button>
            <Button type="button" onPress={publish} loading={isPending} isDisabled={isPending}>
              {messages.composer.submit}
            </Button>
          </div>
          {status && (
            <p
              className="post-status"
              role={status === messages.composer.created ? "status" : "alert"}
            >
              {status}
            </p>
          )}
        </Stack>
      </div>
    );
  }

  return (
    <form id="post-composer" className="post-composer" onSubmit={preview}>
      <Stack gap={4}>
        <div className="post-composer__header">
          <div>
            <p className="showcase-eyebrow">{messages.composer.title}</p>
            <h2 className="settings-section-title">{messages.composer.title}</h2>
          </div>
          <span className="post-composer__counter" aria-live="polite">
            {content.length}/5000
          </span>
        </div>
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
        <MediaUpload
          locale={locale}
          bucket="post-media"
          label={messages.composer.mediaImage}
          uploadLabel={messages.composer.mediaImage}
          failedLabel={messages.pages.failed}
          accept="image/*,video/*"
          maxFiles={10}
          disabled={unavailable || isPending}
          onAssetIdsChange={setMediaAssetIds}
          onPreviewsChange={setPreviews}
        />
        <Button type="submit" isDisabled={unavailable || isPending}>
          {messages.composer.preview}
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
