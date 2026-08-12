import { describe, expect, it } from "vitest";

import {
  defaultLocale,
  getDirection,
  getLocaleConfig,
  isLTR,
  isLocale,
  isRTL,
} from "@/config/locales";
import { formatDate, formatNumber } from "@/i18n/format";
import { replacePathLocale } from "@/i18n/routing";
import { createTranslator } from "@/i18n/translate";

describe("localization infrastructure", () => {
  it("uses one locale registry for names, direction, and validation", () => {
    expect(defaultLocale).toBe("en");
    expect(getLocaleConfig("ar")).toMatchObject({
      code: "ar",
      nativeName: "العربية",
      enabled: true,
    });
    expect(getDirection("en")).toBe("ltr");
    expect(getDirection("ar")).toBe("rtl");
    expect(isLTR("en")).toBe(true);
    expect(isRTL("ar")).toBe(true);
    expect(isLocale("fr")).toBe(true);
    expect(getLocaleConfig("zh").nativeName).toBe("中文");
  });

  it("resolves typed namespaced translations and predictable missing keys", () => {
    expect(createTranslator("en").t("common.save")).toBe("Save");
    expect(createTranslator("ar").t("common.save")).toBe("حفظ");
    expect(createTranslator("ar").t("navigation.settings")).toBe("الإعدادات");
    expect(createTranslator("en").t("common.missing" as never)).toBe("common.missing");
  });

  it("preserves dynamic route segments and formats values with the active locale", () => {
    expect(replacePathLocale("/en/u/example?tab=profile", "ar")).toBe("/ar/u/example?tab=profile");
    expect(formatDate("2026-01-02T12:00:00Z", "en")).not.toHaveLength(0);
    expect(formatDate("2026-01-02T12:00:00Z", "ar")).not.toHaveLength(0);
    expect(formatNumber(1234.5, "ar")).not.toHaveLength(0);
  });
});
