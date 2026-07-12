import { markNotificationRead } from "@/src/features/notifications";
import { requireServerSession } from "@/src/infrastructure/auth";
import { safeJsonRoute } from "@/src/shared/http/safe-json-route";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return safeJsonRoute(async () => {
    const session = await requireServerSession();
    const { id } = await params;
    await markNotificationRead(session.user.id, { notificationId: id });

    return { ok: true };
  }, { fallbackMessage: "Gagal menandai notifikasi." });
}
