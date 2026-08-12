import { describe, expect, it } from "vitest";

import { getSiteMetadata } from "@/config/metadata";

describe("site metadata", () => {
  it("provides English metadata without inventing brand assets", () => {
    const metadata = getSiteMetadata("en");

    expect(metadata.title).toBe("XOWAAK");
    expect(metadata.applicationName).toBe("XOWAAK");
    expect(metadata.description).toBe(
      "A considered digital ecosystem for identity, connection, and room to move.",
    );
    expect(metadata.icons).toMatchObject({ apple: "/icons/icon-192.png" });
  });

  it("provides localized Arabic metadata", () => {
    const metadata = getSiteMetadata("ar");

    expect(metadata.description).toBe("منظومة رقمية مدروسة للهوية والتواصل ومساحة للحركة.");
    expect(metadata.openGraph).toMatchObject({ locale: "ar", siteName: "XOWAAK" });
  });
});
