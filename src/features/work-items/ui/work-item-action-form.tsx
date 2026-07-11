"use client";

import { useActionState, useEffect, useRef } from "react";

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
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
};

export function WorkItemActionForm({
  action,
  children,
  className,
  onSuccess,
  resetOnSuccess = false,
}: WorkItemActionFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    workItemActionInitialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const lastStateRef = useRef(state);

  useEffect(() => {
    if (!state.ok || !state.message || lastStateRef.current === state) {
      return;
    }

    lastStateRef.current = state;
    if (resetOnSuccess) {
      formRef.current?.reset();
    }
    onSuccess?.();
  }, [onSuccess, resetOnSuccess, state, state.message, state.ok]);

  return (
    <form ref={formRef} action={formAction} className={className}>
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
