"use client";

import { useActionState } from "react";

import {
  collaborationActionInitialState,
  type CollaborationActionResult,
} from "../server/action-state";

type CollaborationAction = (
  previousState: CollaborationActionResult,
  formData: FormData,
) => Promise<CollaborationActionResult>;

type CollaborationActionFormProps = {
  action: CollaborationAction;
  children: React.ReactNode;
  className?: string;
  encType?: string;
};

export function CollaborationActionForm({
  action,
  children,
  className,
  encType,
}: CollaborationActionFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    collaborationActionInitialState,
  );

  return (
    <form action={formAction} className={className} encType={encType}>
      <fieldset disabled={isPending} className="space-y-2 disabled:opacity-60">
        {children}
      </fieldset>
      {state.message ? (
        <p
          className={`mt-1 text-xs ${
            state.ok ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
