import { NextResponse } from "next/server";

import { requireServerSession } from "@/src/infrastructure/auth";
import { getServerEnv } from "@/src/infrastructure/env";
import { processOutboxBatch } from "@/src/infrastructure/events";
import { hasValidBearerSecret } from "@/src/infrastructure/jobs/cron-auth";

async function assertCanProcessOutbox(request: Request) {
  const env = getServerEnv();

  if (
    hasValidBearerSecret(
      request.headers.get("authorization"),
      env.OUTBOX_CRON_SECRET,
    )
  ) {
    return;
  }

  const session = await requireServerSession();

  if (session.user.role !== "super_admin" && session.user.role !== "admin") {
    throw new Error("Forbidden.");
  }
}

export async function POST(request: Request) {
  try {
    await assertCanProcessOutbox(request);
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const result = await processOutboxBatch();

  return NextResponse.json(result);
}
