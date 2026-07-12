"use client";

import { useEffect, useRef } from "react";

import { useAppToast } from "@/src/context/ToastContext";

type ActionToastState = {
  ok: boolean;
  message?: string | null;
};

export function useActionToast(state: ActionToastState) {
  const { showToast } = useAppToast();
  const handledStateRef = useRef<ActionToastState | null>(null);

  useEffect(() => {
    if (!state.message || handledStateRef.current === state) {
      return;
    }

    handledStateRef.current = state;
    showToast(state.message, state.ok ? "success" : "error");
  }, [showToast, state]);
}
