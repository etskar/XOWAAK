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
          <span aria-hidden="true">{item.mediaType === "image" ? "IMG" : "VIDEO"}</span>
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
