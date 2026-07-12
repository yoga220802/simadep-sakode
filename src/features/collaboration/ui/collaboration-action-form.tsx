"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  collaborationActionInitialState,
  type CollaborationActionResult,
} from "../server/action-state";
import { useActionToast } from "@/src/shared/ui/use-action-toast";

type CollaborationAction = (
  previousState: CollaborationActionResult,
  formData: FormData,
) => Promise<CollaborationActionResult>;

type CollaborationActionFormProps = {
  action: CollaborationAction;
  children: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
};

export function CollaborationActionForm({
  action,
  children,
  className,
  onSuccess,
  resetOnSuccess = false,
}: CollaborationActionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    action,
    collaborationActionInitialState,
  );
  const handledStateRef = useRef<CollaborationActionResult | null>(null);
  useActionToast(state, {
    isPending,
    loadingMessage: "Memproses kolaborasi tugas...",
  });

  useEffect(() => {
    if (!state.ok || !state.message || handledStateRef.current === state) {
      return;
    }

    handledStateRef.current = state;

    if (resetOnSuccess) {
      formRef.current?.reset();
    }

    onSuccess?.();
  }, [onSuccess, resetOnSuccess, state]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      <fieldset disabled={isPending} className="space-y-2 disabled:opacity-60">
        {children}
      </fieldset>
      {state.message ? (
        <p
          className={`mt-1 text-xs ${
            state.ok ? "text-[var(--color-accent)]" : "text-[var(--color-secondary)]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
