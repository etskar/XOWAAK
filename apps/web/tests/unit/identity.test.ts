import { describe, expect, it } from "vitest";

import { getIdentitySchemas } from "@/domains/identity/validation";
import { getIdentityMessages } from "@/i18n/identity-messages";

describe("identity validation", () => {
  it("normalizes valid usernames and rejects invalid characters", () => {
    const schema = getIdentitySchemas(getIdentityMessages("en")).profile;
    const valid = schema.safeParse({
      username: "  Aak.Khalid ",
      displayName: "AAK Khalid",
      bio: "",
      locationLabel: "",
    });
    const invalid = schema.safeParse({
      username: "not valid",
      displayName: "AAK Khalid",
      bio: "",
      locationLabel: "",
    });

    expect(valid.success).toBe(true);
    expect(valid.success && valid.data.username).toBe("aak.khalid");
    expect(invalid.success).toBe(false);
  });

  it("limits privacy values to the approved foundation", () => {
    const schema = getIdentitySchemas(getIdentityMessages("ar")).privacy;

    expect(
      schema.safeParse({
        visibility: "private",
        discoverability: "not_discoverable",
        contactPrivacy: "authenticated",
      }).success,
    ).toBe(true);
    expect(
      schema.safeParse({
        visibility: "followers_only",
        discoverability: "discoverable",
        contactPrivacy: "authenticated",
      }).success,
    ).toBe(false);
  });
});
