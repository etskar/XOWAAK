"use client";

import { useEffect, useState } from "react";

import { getPostsMessages } from "@/i18n/posts-messages";
import type { Locale } from "@/config/locales";
import type { PostMedia as PostMediaRecord } from "@/server/posts/types";

type PostMediaProps = {
  locale: Locale;
  media: PostMediaRecord[];
};

export function PostMedia({ locale, media }: PostMediaProps) {
  const messages = getPostsMessages(locale);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = media.filter((item) => item.url && item.mediaType === "image");

  useEffect(() => {
    if (lightboxIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLightboxIndex(null);
      }
      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) => Math.max(0, (current ?? 0) - 1));
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((current) =>
          Math.min(images.length - 1, (current ?? 0) + 1),
        );
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex]);

  if (media.length === 0) return null;

  return (
    <>
      <div className="post-media-grid" aria-label={messages.composer.mediaImage}>
        {media.map((item) => (
          <figure key={item.id} className="post-media-placeholder">
            {item.url && item.mediaType === "image" ? (
              // Signed URLs are generated on the server for visible posts only.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={messages.composer.mediaImage}
                loading="lazy"
                onClick={() => setLightboxIndex(images.indexOf(item))}
              />
            ) : item.url && item.mediaType === "video" ? (
              <video src={item.url} controls preload="metadata" />
            ) : (
              <span aria-hidden="true">{item.mediaType === "image" ? "IMG" : "VIDEO"}</span>
            )}
            <figcaption>
              {item.mediaType === "image"
                ? messages.composer.mediaImage
                : messages.composer.mediaVideo}
            </figcaption>
          </figure>
        ))}
      </div>
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="media-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={messages.composer.mediaImage}
          onClick={() => setLightboxIndex(null)}
        >
          <div className="media-lightbox__stage" onClick={(event) => event.stopPropagation()}>
            {/* Signed URLs are generated on the server for visible posts only. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={images[lightboxIndex].id}
              src={images[lightboxIndex].url ?? ""}
              alt={messages.composer.mediaImage}
            />
            <div className="media-lightbox__toolbar">
              <button
                type="button"
                aria-label={messages.engagement.previous}
                disabled={lightboxIndex === 0}
                onClick={() => setLightboxIndex((current) => Math.max(0, (current ?? 0) - 1))}
              >
                ←
              </button>
              <span>
                {lightboxIndex + 1}/{images.length}
              </span>
              <button
                type="button"
                aria-label={messages.engagement.next}
                disabled={lightboxIndex === images.length - 1}
                onClick={() =>
                  setLightboxIndex((current) =>
                    Math.min(images.length - 1, (current ?? 0) + 1),
                  )
                }
              >
                →
              </button>
              <button
                type="button"
                aria-label={messages.engagement.close}
                onClick={() => setLightboxIndex(null)}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}