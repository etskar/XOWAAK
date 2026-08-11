import { describe, expect, it } from "vitest";

import { appConfig } from "@/config/app";
import { getDirection, isLocale } from "@/config/locales";

describe("application foundation", () => {
  it("exposes the default application name", () => {
    expect(appConfig.name).toBe("XOWAAK");
  });

  it("recognizes the initial locale foundation", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(getDirection("ar")).toBe("rtl");
  });
});
