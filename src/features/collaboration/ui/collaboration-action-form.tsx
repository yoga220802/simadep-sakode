"use client";

import { useActionState, useEffect, useRef } from "react";

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
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
};

export function CollaborationActionForm({
  action,
  children,
  className,
  encType,
  onSuccess,
  resetOnSuccess = false,
}: CollaborationActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    action,
    collaborationActionInitialState,
  );

  useEffect(() => {
    if (!state.ok || !state.message) {
      return;
    }

    if (resetOnSuccess) {
      formRef.current?.reset();
    }

    onSuccess?.();
  }, [onSuccess, resetOnSuccess, state.message, state.ok]);

  return (
    <form ref={formRef} action={formAction} className={className} encType={encType}>
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
