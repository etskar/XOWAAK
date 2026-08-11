import { describe, expect, it } from "vitest";

import { getSocialMessages } from "@/i18n/social-messages";

describe("social graph foundation", () => {
  it("provides localized relationship labels", () => {
    expect(getSocialMessages("en").actions.follow).toBe("Follow");
    expect(getSocialMessages("ar").actions.follow).toBe("متابعة");
  });
});
