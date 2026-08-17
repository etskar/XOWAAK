"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/design-system";
import { joinGroup } from "@/server/platform/actions";

export function GroupJoinButton({
  groupId,
  label,
  failedLabel,
}: {
  groupId: string;
  label: string;
  failedLabel: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function join() {
    setError(null);
    startTransition(() => {
      void joinGroup({ groupId }).then((result) => {
        if (!result.ok) {
          setError(failedLabel);
          return;
        }
        router.refresh();
      });
    });
  }

  return (
    <span className="group-join">
      <Button type="button" loading={isPending} isDisabled={isPending} onPress={join}>
        {label}
      </Button>
      {error && (
        <span className="group-join__error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}