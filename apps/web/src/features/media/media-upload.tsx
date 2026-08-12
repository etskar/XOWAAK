"use client";

import { useId, useState, useTransition } from "react";

import type { Locale } from "@/config/locales";
import { createSupabaseBrowserClient } from "@/supabase/browser";
import { markMediaAssetsDeleted, registerMediaAsset } from "@/server/media/actions";

type MediaBucket = "avatars" | "post-media" | "message-media" | "platform-media";

type MediaUploadProps = {
  locale: Locale;
  bucket: MediaBucket;
  label: string;
  helpText?: string;
  uploadLabel: string;
  failedLabel: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
  onAssetIdsChange: (assetIds: string[]) => void;
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
  failedLabel,
  accept = "image/*,video/*",
  multiple = true,
  maxFiles = 10,
  maxSizeBytes = 25 * 1024 * 1024,
  disabled = false,
  onAssetIdsChange,
}: MediaUploadProps) {
  const inputId = useId();
  const [names, setNames] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    const selected = Array.from(files).slice(0, maxFiles);
    startTransition(() => {
      void (async () => {
        setStatus(null);
        const supabase = createSupabaseBrowserClient();
        const uploadedIds: string[] = [];
        const uploadedPaths: string[] = [];

        try {
          const { data } = await supabase.auth.getUser();
          if (!data.user) throw new Error("unauthenticated");

          for (const file of selected) {
            if (file.size > maxSizeBytes) throw new Error("too_large");
            const path = `${data.user.id}/${crypto.randomUUID()}${extensionFor(file)}`;
            const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
              cacheControl: "3600",
              contentType: file.type,
              upsert: false,
            });
            if (uploadError) throw uploadError;
            uploadedPaths.push(path);

            const result = await registerMediaAsset({
              bucket,
              objectPath: path,
              mimeType: file.type,
              sizeBytes: file.size,
            });
            if (!result.ok) throw new Error(result.code);
            uploadedIds.push(result.id);
          }

          setNames((current) => [...current, ...selected.map((file) => file.name)]);
          onAssetIdsChange(uploadedIds);
        } catch {
          if (uploadedIds.length > 0) {
            await markMediaAssetsDeleted(uploadedIds);
          }
          if (uploadedPaths.length > 0) {
            await supabase.storage.from(bucket).remove(uploadedPaths);
          }
          setStatus(failedLabel);
        }
      })();
    });
  }

  return (
    <div className="media-upload" data-locale={locale}>
      <div className="media-upload__heading">
        <span className="ds-field__label">{label}</span>
        {helpText && <span className="ds-field__description">{helpText}</span>}
      </div>
      <label className="media-upload__control" htmlFor={inputId}>
        <span>{isPending ? "..." : uploadLabel}</span>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled || isPending}
          onChange={(event) => upload(event.target.files)}
        />
      </label>
      {names.length > 0 && (
        <ul className="media-upload__list">
          {names.map((name, index) => (
            <li key={`${name}-${index}`}>{name}</li>
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
