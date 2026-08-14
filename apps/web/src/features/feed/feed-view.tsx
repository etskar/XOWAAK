import { Badge, Card, Container, ErrorState } from "@/design-system";
import type { Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { FeedStream } from "@/features/feed/feed-stream";
import { Fab } from "@/features/posts/fab";
import { encodeFeedCursor } from "@/server/feed/types";
import type { FeedListResult, FeedQueryResult } from "@/server/feed/types";

type FeedViewProps = {
  locale: Locale;
  viewerId: string;
  result: FeedQueryResult<FeedListResult>;
  profileComplete: boolean;
};

export function FeedView({ locale, viewerId, result, profileComplete }: FeedViewProps) {
  const { t } = createTranslator(locale);
  const unavailable = result.status === "unavailable";
  const queryError = result.status === "error";

  return (
    <main className="feed-page" data-locale={locale}>
      <Container size="xl">
        <div className="feed-page__header">
          <div>
            <p className="showcase-eyebrow">XOWAAK</p>
            <h1 className="ds-text-h1">{t("navigation.home")}</h1>
          </div>
        </div>
        {queryError && (
          <ErrorState title={t("errors.unexpected")} description={t("errors.reload")} />
        )}
        {unavailable && (
          <Card className="feed-unavailable">
            <Badge variant="warning">{t("common.configurationTitle")}</Badge>
            <p>{t("common.configurationDescription")}</p>
          </Card>
        )}
        {result.status === "ok" && (
          <FeedStream
            locale={locale}
            viewerId={viewerId}
            initialItems={result.data.items}
            initialCursor={
              result.data.nextCursor ? encodeFeedCursor(result.data.nextCursor) : null
            }
            hasMore={result.data.hasMore}
          />
        )}
        {!queryError && !unavailable && <Fab locale={locale} profileComplete={profileComplete} />}
      </Container>
    </main>
  );
}