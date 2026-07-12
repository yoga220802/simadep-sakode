import {
  listNotificationInbox,
  markAllNotificationsRead,
} from "@/src/features/notifications";
import { requireServerSession } from "@/src/infrastructure/auth";
import { safeJsonRoute } from "@/src/shared/http/safe-json-route";

export async function GET(request: Request) {
  return safeJsonRoute(async () => {
    const session = await requireServerSession();
    const url = new URL(request.url);
    const limit = url.searchParams.get("limit") ?? undefined;

    return listNotificationInbox(session.user.id, { limit });
  }, { fallbackMessage: "Gagal memuat notifikasi." });
}

export async function PATCH() {
  return safeJsonRoute(async () => {
    const session = await requireServerSession();
    await markAllNotificationsRead(session.user.id);

    return { ok: true };
  }, { fallbackMessage: "Gagal memperbarui notifikasi." });
}
