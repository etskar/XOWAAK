import { describe, expect, it } from "vitest";

import { isPostPublishable, postSchema } from "@/domains/posts/validation";
import { decodePostCursor, encodePostCursor } from "@/server/posts/pagination";

describe("posts foundation", () => {
  it("rejects empty text without media and accepts valid visibility", () => {
    const empty = postSchema.safeParse({ content: "", visibility: "public", mediaAssetIds: [] });
    const valid = postSchema.safeParse({
      content: "Hello XOWAAK",
      visibility: "followers",
      mediaAssetIds: [],
    });

    expect(empty.success).toBe(true);
    expect(isPostPublishable("", [])).toBe(false);
    expect(valid.success).toBe(true);
    expect(isPostPublishable("", ["00000000-0000-0000-0000-000000000001"])).toBe(true);
  });

  it("round-trips deterministic feed cursors and rejects invalid cursors", () => {
    const cursor = {
      createdAt: "2026-01-01T00:00:00.000Z",
      id: "00000000-0000-0000-0000-000000000001",
    };
    expect(decodePostCursor(encodePostCursor(cursor))).toEqual(cursor);
    expect(decodePostCursor("not-a-cursor")).toBeNull();
  });
});
