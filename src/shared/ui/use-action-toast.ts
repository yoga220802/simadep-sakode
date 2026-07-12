"use client";

import { useEffect, useRef } from "react";

import { useAppToast } from "@/src/context/ToastContext";

type ActionToastState = {
  ok: boolean;
  message?: string | null;
};

type ActionToastOptions = {
  isPending?: boolean;
  loadingMessage?: string;
  loadingTitle?: string;
};

export function useActionToast(
  state: ActionToastState,
  {
    isPending = false,
    loadingMessage = "Mohon tunggu, sistem sedang memproses aksi ini.",
    loadingTitle = "Memproses",
  }: ActionToastOptions = {},
) {
  const { showToast, showLoadingToast } = useAppToast();
  const handledStateRef = useRef<ActionToastState | null>(null);
  const closeLoadingToastRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isPending && !closeLoadingToastRef.current) {
      closeLoadingToastRef.current = showLoadingToast(
        loadingMessage,
        loadingTitle,
      );
      return;
    }

    if (!isPending && closeLoadingToastRef.current) {
      closeLoadingToastRef.current();
      closeLoadingToastRef.current = null;
    }
  }, [isPending, loadingMessage, loadingTitle, showLoadingToast]);

  useEffect(() => {
    if (!state.message || handledStateRef.current === state) {
      return;
    }

    if (closeLoadingToastRef.current) {
      closeLoadingToastRef.current();
      closeLoadingToastRef.current = null;
    }

    handledStateRef.current = state;
    showToast(state.message, state.ok ? "success" : "error");
  }, [showToast, state]);

  useEffect(() => {
    return () => {
      if (closeLoadingToastRef.current) {
        closeLoadingToastRef.current();
        closeLoadingToastRef.current = null;
      }
    };
  }, []);
}
