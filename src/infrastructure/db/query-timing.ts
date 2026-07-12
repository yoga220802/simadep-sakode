import "@/src/infrastructure/server-only";

export async function timeQuery<T>(
  label: string,
  operation: () => Promise<T>,
): Promise<T> {
  const start = performance.now();

  try {
    return await operation();
  } finally {
    if (process.env.NODE_ENV !== "production") {
      const durationMs = Math.round(performance.now() - start);
      console.info(`[query-timing] ${label} ${durationMs}ms`);
    }
  }
}
