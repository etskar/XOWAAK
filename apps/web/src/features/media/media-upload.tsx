"use client";

import { useId, useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";

import type { Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { createSupabaseBrowserClient } from "@/supabase/browser";
import { markMediaAssetsDeleted, registerMediaAsset } from "@/server/media/actions";

type MediaBucket = "avatars" | "post-media" | "message-media" | "platform-media" | "covers";

type MediaUploadProps = {
  locale: Locale;
  bucket: MediaBucket;
  label: string;
  helpText?: string;
  uploadLabel: string;
  replaceLabel?: string;
  removeLabel?: string;
  failedLabel: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
  onAssetIdsChange: (assetIds: string[]) => void;
  onLocalPreview?: (url: string | null) => void;
  onPreviewsChange?: (urls: string[]) => void;
};

type MediaItem = {
  key: string;
  assetId: string | null;
  objectPath: string;
  name: string;
  url: string;
  kind: "image" | "video";
};

function extensionFor(file: File) {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return extension ? `.${extension}` : "";
}

export function MediaUpload({
  locale,
  bucket,
  label,
  helpText,
  uploadLabel,
  replaceLabel,
  removeLabel,
  failedLabel,
  accept = "image/*,video/*",
  multiple = true,
  maxFiles = 10,
  maxSizeBytes = 25 * 1024 * 1024,
  disabled = false,
  onAssetIdsChange,
  onLocalPreview,
  onPreviewsChange,
}: MediaUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isSingle = maxFiles === 1;
  const { t } = createTranslator(locale);

  function notify(nextItems: MediaItem[]) {
    onAssetIdsChange(
      nextItems.map((item) => item.assetId).filter((id): id is string => Boolean(id)),
    );
    if (onLocalPreview) {
      onLocalPreview(nextItems[0]?.url ?? null);
    }
    if (onPreviewsChange) {
      onPreviewsChange(nextItems.map((item) => item.url));
    }
  }

  async function uploadFile(file: File): Promise<MediaItem> {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("unauthenticated");
    if (file.size > maxSizeBytes) throw new Error("too_large");

    const objectPath = `${data.user.id}/${crypto.randomUUID()}${extensionFor(file)}`;
    const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const result = await registerMediaAsset({
      bucket,
      objectPath,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (!result.ok) {
      await supabase.storage.from(bucket).remove([objectPath]);
      throw new Error(result.code);
    }

    return {
      key: crypto.randomUUID(),
      assetId: result.id,
      objectPath,
      name: file.name,
      url: URL.createObjectURL(file),
      kind: file.type.startsWith("video/") ? "video" : "image",
    };
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;
    const selected = Array.from(files).slice(0, maxFiles);
    if (items.length + selected.length > maxFiles) {
      setStatus(failedLabel);
      return;
    }

    startTransition(() => {
      void (async () => {
        setStatus(null);
        const successes: MediaItem[] = [];
        let failed = false;
        for (const file of selected) {
          try {
            successes.push(await uploadFile(file));
          } catch {
            failed = true;
          }
        }
        const nextItems = [...items, ...successes];
        setItems(nextItems);
        notify(nextItems);
        if (failed) setStatus(failedLabel);
      })();
    });
  }

  async function removeItem(key: string) {
    const item = items.find((candidate) => candidate.key === key);
    if (!item) return;
    URL.revokeObjectURL(item.url);
    const nextItems = items.filter((candidate) => candidate.key !== key);
    setItems(nextItems);
    notify(nextItems);
    if (item.assetId) {
      await markMediaAssetsDeleted([item.assetId]);
      const supabase = createSupabaseBrowserClient();
      await supabase.storage.from(bucket).remove([item.objectPath]);
    }
  }

  function moveItem(key: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.key === key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const nextItems = [...items];
    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(target, 0, moved);
    setItems(nextItems);
    notify(nextItems);
  }

  const controlLabel =
    isSingle && items.length > 0 ? (replaceLabel ?? uploadLabel) : uploadLabel;

  return (
    <div className="media-upload" data-locale={locale}>
      <div className="media-upload__heading">
        <span className="ds-field__label">{label}</span>
        {helpText && <span className="ds-field__description">{helpText}</span>}
      </div>
      <label className="media-upload__control" htmlFor={inputId}>
        <span>{isPending ? t("common.mediaUploading") : controlLabel}</span>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled || isPending}
          onChange={handleChange}
        />
      </label>
      {items.length > 0 && (
        <ul className="media-upload__list">
          {items.map((item, index) => (
            <li key={item.key} className="media-upload__item">
              <span className="media-upload__thumb">
                {item.kind === "video" ? (
                  <video src={item.url} muted playsInline preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt="" loading="lazy" decoding="async" />
                )}
              </span>
              <span className="media-upload__meta">
                <strong title={item.name}>{item.name}</strong>
              </span>
              {!isSingle && (
                <span className="media-upload__reorder">
                  <button
                    type="button"
                    onClick={() => moveItem(item.key, -1)}
                    disabled={index === 0 || disabled || isPending}
                    aria-label={t("common.mediaMoveBackward")}
                  >
                    <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M13 4 7 10l6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(item.key, 1)}
                    disabled={index === items.length - 1 || disabled || isPending}
                    aria-label={t("common.mediaMoveForward")}
                  >
                    <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="m7 4 6 6-6 6" />
                    </svg>
                  </button>
                </span>
              )}
              <button
                type="button"
                className="media-upload__remove"
                onClick={() => void removeItem(item.key)}
                disabled={disabled || isPending}
                aria-label={removeLabel ?? t("common.mediaRemove")}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M5 5l10 10M15 5 5 15" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      {status && (
        <p className="settings-status" role="alert">
          {status}
        </p>
      )}
    </div>
  );
}