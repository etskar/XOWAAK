import type { PostCursor } from "@/server/posts/types";

const uuidPattern = /^[0-9a-f-]{36}$/i;

export function encodePostCursor(cursor: PostCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodePostCursor(value: string | null | undefined): PostCursor | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<PostCursor>;
    if (typeof parsed.createdAt !== "string" || Number.isNaN(Date.parse(parsed.createdAt)))
      return null;
    if (typeof parsed.id !== "string" || !uuidPattern.test(parsed.id)) return null;
    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}
