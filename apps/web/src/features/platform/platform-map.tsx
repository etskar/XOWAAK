import Link from "next/link";
import type { Route } from "next";

import { Badge, Card, Container, EmptyState } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { createTranslator } from "@/i18n/translate";
import type { LocationRecord, PlatformResult } from "@/server/platform/types";

export function PlatformMap({
  locale,
  result,
}: {
  locale: Locale;
  result: PlatformResult<LocationRecord[]>;
}) {
  const app = getAppMessages(locale);
  const { t } = createTranslator(locale);

  return (
    <main className="platform-page map-page">
      <Container size="xl">
        <div className="platform-page__header">
          <div>
            <p className="showcase-eyebrow">XOWAAK / {t("navigation.map")}</p>
            <h1 className="ds-text-h1">{app.mapTitle}</h1>
            <p>{app.emptyContent}</p>
          </div>
          <Badge variant={result.status === "ok" && result.data.length ? "success" : "warning"}>
            {result.status === "ok" && result.data.length ? app.current : app.unavailable}
          </Badge>
        </div>
        {result.status === "ok" && result.data.length === 0 ? (
          <EmptyState title={app.emptyContent} description={t("common.reserved")} />
        ) : result.status !== "ok" ? (
          <EmptyState title={app.unavailable} description={t("common.configurationDescription")} />
        ) : (
          <div className="platform-map-layout">
            <Card className="platform-map-canvas" aria-label={app.mapTitle}>
              {result.data.map((item) => {
                const left = ((item.longitude + 180) / 360) * 100;
                const top = ((90 - item.latitude) / 180) * 100;
                return (
                  <Link
                    key={`${item.kind}-${item.id}`}
                    className={`platform-map-marker platform-map-marker--${item.kind}`}
                    href={item.href.replace(/^\/en/, `/${locale}`) as Route}
                    style={{
                      left: `${Math.min(96, Math.max(4, left))}%`,
                      top: `${Math.min(94, Math.max(6, top))}%`,
                    }}
                    aria-label={item.title}
                  >
                    <span />
                  </Link>
                );
              })}
              <span className="platform-map-canvas__label">
                {result.data.length} {app.current}
              </span>
            </Card>
            <div className="platform-map-list">
              {result.data.map((item) => (
                <Link
                  key={`${item.kind}-${item.id}`}
                  className="platform-map-list__item"
                  href={item.href.replace(/^\/en/, `/${locale}`) as Route}
                >
                  <span className={`platform-map-list__dot platform-map-list__dot--${item.kind}`} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.locationLabel ?? app.mapTitle}</small>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Container>
    </main>
  );
}
