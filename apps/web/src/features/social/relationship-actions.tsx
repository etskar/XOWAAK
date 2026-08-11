"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Dialog } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getSocialMessages } from "@/i18n/social-messages";
import {
  acceptFollowRequest,
  blockUser,
  cancelFollowRequest,
  followUser,
  rejectFollowRequest,
  unblockUser,
  unfollowUser,
} from "@/server/social/actions";
import type { Relationship } from "@/server/social/types";

type RelationshipActionsProps = {
  locale: Locale;
  targetUserId: string;
  relationship: Relationship | null;
};

export function RelationshipActions({
  locale,
  targetUserId,
  relationship,
}: RelationshipActionsProps) {
  const router = useRouter();
  const messages = getSocialMessages(locale);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  if (!relationship) return null;
  const state = relationship?.state ?? "none";

  function run(action: () => Promise<{ ok: boolean; code?: string }>) {
    startTransition(() => {
      void (async () => {
        const result = await action();
        if (!result.ok) {
          setStatus(
            result.code === "blocked" ? messages.errors.blocked : messages.errors.unavailable,
          );
          return;
        }
        setStatus(null);
        router.refresh();
      })();
    });
  }

  const blockDialog = (
    <Dialog
      trigger={
        <Button type="button" variant="ghost" isDisabled={isPending}>
          {state === "blocked" ? messages.actions.unblock : messages.actions.block}
        </Button>
      }
      title={state === "blocked" ? messages.actions.unblock : messages.pages.blockTitle}
      closeLabel={messages.actions.close}
    >
      <div className="social-confirmation">
        <p>{messages.pages.blockDescription}</p>
        <Button
          type="button"
          variant={state === "blocked" ? "secondary" : "destructive"}
          loading={isPending}
          isDisabled={isPending}
          onPress={() =>
            run(() =>
              state === "blocked"
                ? unblockUser({ userId: targetUserId })
                : blockUser({ userId: targetUserId }),
            )
          }
        >
          {state === "blocked" ? messages.actions.unblock : messages.actions.confirmBlock}
        </Button>
      </div>
    </Dialog>
  );

  if (state === "blocked_by") {
    return <span className="social-relationship-state">{messages.states.blockedBy}</span>;
  }

  return (
    <div className="social-actions" data-state={state}>
      {state === "none" && (
        <Button
          type="button"
          loading={isPending}
          isDisabled={isPending}
          onPress={() => run(() => followUser({ userId: targetUserId }))}
        >
          {messages.actions.follow}
        </Button>
      )}
      {state === "pending_outgoing" && (
        <Button
          type="button"
          variant="outline"
          loading={isPending}
          isDisabled={isPending}
          onPress={() => run(() => cancelFollowRequest({ userId: targetUserId }))}
        >
          {messages.actions.cancelRequest}
        </Button>
      )}
      {state === "pending_incoming" && (
        <>
          <Button
            type="button"
            loading={isPending}
            isDisabled={isPending}
            onPress={() =>
              relationship.followId &&
              run(() => acceptFollowRequest({ requestId: relationship.followId }))
            }
          >
            {messages.actions.acceptRequest}
          </Button>
          <Button
            type="button"
            variant="outline"
            isDisabled={isPending}
            onPress={() =>
              relationship.followId &&
              run(() => rejectFollowRequest({ requestId: relationship.followId }))
            }
          >
            {messages.actions.rejectRequest}
          </Button>
        </>
      )}
      {(state === "following" || state === "followed_by" || state === "mutual") && (
        <Button
          type="button"
          variant="outline"
          loading={isPending}
          isDisabled={isPending}
          onPress={() => run(() => unfollowUser({ userId: targetUserId }))}
        >
          {state === "followed_by" ? messages.states.followedBy : messages.actions.unfollow}
        </Button>
      )}
      {blockDialog}
      {status && (
        <span className="social-relationship-state" role="status">
          {status}
        </span>
      )}
    </div>
  );
}
