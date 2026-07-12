import { requireServerSession } from "@/src/infrastructure/auth";
import { getServerEnv } from "@/src/infrastructure/env";
import { processOutboxBatch } from "@/src/infrastructure/events";
import { hasValidBearerSecret } from "@/src/infrastructure/jobs/cron-auth";
import { safeJsonRoute } from "@/src/shared/http/safe-json-route";

async function assertCanProcessOutbox(request: Request) {
  const env = getServerEnv();
  const authorizationHeader = request.headers.get("authorization");

  if (
    hasValidBearerSecret(authorizationHeader, env.CRON_SECRET) ||
    hasValidBearerSecret(authorizationHeader, env.OUTBOX_CRON_SECRET)
  ) {
    return;
  }

  const session = await requireServerSession();

  if (session.user.role !== "super_admin" && session.user.role !== "admin") {
    throw new Error("Forbidden.");
  }
}

async function processOutboxRequest(request: Request) {
  return safeJsonRoute(async () => {
    await assertCanProcessOutbox(request);

    return processOutboxBatch();
  }, { fallbackMessage: "Gagal memproses outbox." });
}

export async function GET(request: Request) {
  return processOutboxRequest(request);
}

export async function POST(request: Request) {
  return processOutboxRequest(request);
}
