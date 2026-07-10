if (typeof window !== "undefined") {
  throw new Error("Server-only infrastructure was imported in the browser.");
}

export const serverOnlyBoundary = "server-only" as const;
