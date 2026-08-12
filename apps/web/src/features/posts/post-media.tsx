import { getPostsMessages } from "@/i18n/posts-messages";
import type { Locale } from "@/config/locales";
import type { PostMedia as PostMediaRecord } from "@/server/posts/types";

type PostMediaProps = {
  locale: Locale;
  media: PostMediaRecord[];
};

export function PostMedia({ locale, media }: PostMediaProps) {
  if (media.length === 0) return null;
  const messages = getPostsMessages(locale);

  return (
    <div className="post-media-grid" aria-label={messages.composer.mediaImage}>
      {media.map((item) => (
        <figure key={item.id} className="post-media-placeholder">
          {item.url && item.mediaType === "image" ? (
            // Signed URLs are generated on the server for visible posts only.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.url} alt={messages.composer.mediaImage} />
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
  );
}
