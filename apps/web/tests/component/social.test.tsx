import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RelationshipActions } from "@/features/social/relationship-actions";
import { SocialUserList } from "@/features/social/social-user-list";
import { getSocialMessages } from "@/i18n/social-messages";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/server/social/actions", () => ({
  acceptFollowRequest: vi.fn(),
  blockUser: vi.fn(),
  cancelFollowRequest: vi.fn(),
  followUser: vi.fn(),
  rejectFollowRequest: vi.fn(),
  unblockUser: vi.fn(),
  unfollowUser: vi.fn(),
}));

describe("social graph components", () => {
  it("renders an accessible follow action for an unactioned relationship", () => {
    render(
      <RelationshipActions
        locale="en"
        targetUserId="00000000-0000-0000-0000-000000000001"
        relationship={{ state: "none", followId: null }}
      />,
    );

    expect(
      screen.getByRole("button", { name: getSocialMessages("en").actions.follow }),
    ).toBeInTheDocument();
  });

  it("renders Arabic empty follower state without adding domain actions", () => {
    const messages = getSocialMessages("ar");

    render(
      <SocialUserList
        locale="ar"
        items={[]}
        emptyTitle={messages.pages.noFollowers}
        emptyDescription={messages.pages.followers}
      />,
    );

    expect(screen.getByText(messages.pages.noFollowers)).toBeInTheDocument();
  });
});
