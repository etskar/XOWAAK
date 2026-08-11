import { describe, expect, it } from "vitest";

import { getSiteMetadata } from "@/config/metadata";

describe("site metadata", () => {
  it("provides English metadata without inventing brand assets", () => {
    const metadata = getSiteMetadata("en");

    expect(metadata.title).toBe("XOWAAK");
    expect(metadata.applicationName).toBe("XOWAAK");
    expect(metadata.description).toBe("XOWAAK digital ecosystem foundation");
    expect(metadata.icons).toBeUndefined();
  });

  it("provides localized Arabic metadata", () => {
    const metadata = getSiteMetadata("ar");

    expect(metadata.description).toBe("الأساس التقني لمنظومة XOWAAK الرقمية");
    expect(metadata.openGraph).toMatchObject({ locale: "ar", siteName: "XOWAAK" });
  });
});
