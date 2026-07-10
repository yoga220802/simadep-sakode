"use client";

import { useActionState } from "react";

import {
  workItemActionInitialState,
  type WorkItemActionResult,
} from "../server/action-state";

type WorkItemAction = (
  previousState: WorkItemActionResult,
  formData: FormData,
) => Promise<WorkItemActionResult>;

type WorkItemActionFormProps = {
  action: WorkItemAction;
  children: React.ReactNode;
  className?: string;
};

export function WorkItemActionForm({
  action,
  children,
  className,
}: WorkItemActionFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    workItemActionInitialState,
  );

  return (
    <form action={formAction} className={className}>
      <fieldset disabled={isPending} className="space-y-3 disabled:opacity-60">
        {children}
      </fieldset>
      {state.message ? (
        <p
          className={`mt-2 text-xs ${
            state.ok ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
