"use client";

import { useEffect, useState } from "react";

import type { NavigationCapabilities } from "../domain/navigation-capabilities";

type NavigationCapabilityState = {
  capabilities: NavigationCapabilities | null;
  isLoading: boolean;
  error: string | null;
};

export function useNavigationCapabilities(): NavigationCapabilityState {
  const [state, setState] = useState<NavigationCapabilityState>({
    capabilities: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadCapabilities() {
      try {
        const response = await fetch("/api/navigation/capabilities", {
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Navigation capabilities unavailable.");
        }

        const capabilities =
          (await response.json()) as NavigationCapabilities;

        if (isMounted) {
          setState({ capabilities, isLoading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            capabilities: null,
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Navigation capabilities unavailable.",
          });
        }
      }
    }

    void loadCapabilities();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
