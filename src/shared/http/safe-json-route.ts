import { NextResponse } from "next/server";

import { getUserSafeErrorMessage } from "@/src/shared/errors";

type SafeJsonRouteOptions = {
  fallbackMessage: string;
};

function statusFromError(error: unknown) {
  if (!(error instanceof Error)) {
    return 500;
  }

  const message = error.message.toLowerCase();
  if (message.includes("unauthorized") || message.includes("session")) {
    return 401;
  }
  if (message.includes("forbidden") || message.includes("not allowed")) {
    return 403;
  }
  if (
    message.includes("invalid") ||
    message.includes("wajib") ||
    message.includes("tidak valid")
  ) {
    return 400;
  }

  return 500;
}

export async function safeJsonRoute<T>(
  handler: () => Promise<T>,
  options: SafeJsonRouteOptions,
) {
  try {
    return NextResponse.json(await handler());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: getUserSafeErrorMessage(error, options.fallbackMessage),
      },
      { status: statusFromError(error) },
    );
  }
}
