import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PostCard } from "@/features/posts/post-card";
import { PostComposer } from "@/features/posts/post-composer";
import { getPostsMessages } from "@/i18n/posts-messages";
import type { PostRecord } from "@/server/posts/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/server/posts/actions", () => ({
  createPost: vi.fn(),
  deletePost: vi.fn(),
  updatePost: vi.fn(),
}));

const post: PostRecord = {
  id: "00000000-0000-0000-0000-000000000001",
  authorId: "00000000-0000-0000-0000-000000000002",
  content: "A foundation post",
  visibility: "public",
  status: "published",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  deletedAt: null,
  author: {
    id: "00000000-0000-0000-0000-000000000002",
    username: "example",
    displayName: "Example User",
    avatarMediaId: null,
  },
  media: [],
};

describe("post components", () => {
  it("renders a localized accessible post card", () => {
    render(<PostCard locale="ar" post={post} isOwner />);

    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.getByText("A foundation post")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /عرض المنشور/ })).toBeInTheDocument();
  });

  it("renders an unavailable composer without claiming persistence", () => {
    const messages = getPostsMessages("en");
    render(<PostComposer locale="en" unavailable />);

    expect(screen.getByRole("textbox", { name: messages.composer.title })).toBeDisabled();
    expect(screen.getByText(messages.pages.unavailable)).toBeInTheDocument();
  });
});
