"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button, Card, EmptyState, Input, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getMessagingMessages } from "@/i18n/messaging-messages";
import {
  inviteGroupMember,
  respondToGroupInvitation,
} from "@/server/platform/group-actions";
import { removeGroupMember, setGroupMemberRole } from "@/server/platform/actions";
import type { GroupMemberRecord, PlatformResult } from "@/server/platform/types";

type GroupMembersProps = {
  locale: Locale;
  groupId: string;
  result: PlatformResult<GroupMemberRecord[]>;
  viewerIsOwner: boolean;
};

export function GroupMembers({ locale, groupId, result, viewerIsOwner }: GroupMembersProps) {
  const messages = getMessagingMessages(locale);
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const members = result.status === "ok" ? result.data : [];
  const viewer = members.find((member) => member.isViewer);
  const canInvite =
    viewer?.status === "active" && (viewer.role === "owner" || viewer.role === "admin");
  const viewerIsManager = viewerIsOwner || viewer?.role === "admin";
  const invitation = viewer?.status === "invited";

  function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(() => {
      void inviteGroupMember({ groupId, username }).then((response) => {
        if (!response.ok) {
          setStatus(messages.failed);
          return;
        }
        setUsername("");
        setStatus(messages.invited);
        router.refresh();
      });
    });
  }

  function respond(accept: boolean) {
    startTransition(() => {
      void respondToGroupInvitation({ groupId, accept }).then((response) => {
        if (!response.ok) {
          setStatus(messages.failed);
          return;
        }
        router.refresh();
      });
    });
  }

  function changeRole(member: GroupMemberRecord, role: "admin" | "member") {
    setStatus(null);
    startTransition(() => {
      void setGroupMemberRole({ groupId, userId: member.userId, role }).then((response) => {
        setStatus(response.ok ? messages.roleUpdated : messages.failed);
        if (response.ok) router.refresh();
      });
    });
  }

  function remove(member: GroupMemberRecord) {
    setStatus(null);
    startTransition(() => {
      void removeGroupMember({ groupId, userId: member.userId }).then((response) => {
        setStatus(response.ok ? messages.memberRemoved : messages.failed);
        if (response.ok) router.refresh();
      });
    });
  }

  function leave() {
    if (!viewer) return;
    setStatus(null);
    startTransition(() => {
      void removeGroupMember({ groupId, userId: viewer.userId }).then((response) => {
        setStatus(response.ok ? messages.leftGroup : messages.failed);
        if (response.ok) router.refresh();
      });
    });
  }

  return (
    <Card className="group-members">
      <div className="group-members__header">
        <h2>{messages.members}</h2>
        <span>{members.filter((member) => member.status === "active").length}</span>
      </div>
      {members.length === 0 ? (
        <EmptyState title={messages.members} description={messages.noConversations} />
      ) : (
        <div className="group-members__list">
          {members.map((member) => (
            <div key={member.userId} className="group-members__item">
              <div>
                <strong>{member.displayName}</strong>
                <span>
                  @{member.username} · {member.role}
                  {member.status === "invited" ? ` · ${messages.invite}` : ""}
                </span>
              </div>
              {member.isViewer ? (
                <Button type="button" variant="ghost" size="sm" onPress={leave} isDisabled={isPending}>
                  {messages.leaveGroup}
                </Button>
              ) : (
                member.status === "active" && (
                  <span className="group-members__manage">
                    {viewerIsOwner && member.role !== "owner" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onPress={() =>
                          changeRole(member, member.role === "admin" ? "member" : "admin")
                        }
                        isDisabled={isPending}
                      >
                        {member.role === "admin" ? messages.makeMember : messages.makeAdmin}
                      </Button>
                    )}
                    {viewerIsManager &&
                      member.role !== "owner" &&
                      (viewerIsOwner || member.role === "member") && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onPress={() => remove(member)}
                          isDisabled={isPending}
                        >
                          {messages.removeMember}
                        </Button>
                      )}
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      )}
      {invitation && (
        <div className="group-members__invite-response">
          <Button
            type="button"
            onPress={() => respond(true)}
            loading={isPending}
            isDisabled={isPending}
          >
            {messages.accept}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onPress={() => respond(false)}
            loading={isPending}
            isDisabled={isPending}
          >
            {messages.decline}
          </Button>
        </div>
      )}
      {canInvite && (
        <form className="group-members__form" onSubmit={invite}>
          <Stack gap={3}>
            <Input
              label={messages.inviteUsername}
              value={username}
              onChange={setUsername}
              isDisabled={isPending}
              inputProps={{ name: "username", autoComplete: "off" }}
            />
            <Button type="submit" loading={isPending} isDisabled={isPending || !username.trim()}>
              {messages.invite}
            </Button>
          </Stack>
        </form>
      )}
      {status && <p role="status">{status}</p>}
    </Card>
  );
}