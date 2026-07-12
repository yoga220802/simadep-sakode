import {
  registerDeviceToken,
  revokeDeviceToken,
} from "@/src/features/notifications";
import { requireServerSession } from "@/src/infrastructure/auth";
import { safeJsonRoute } from "@/src/shared/http/safe-json-route";

export async function POST(request: Request) {
  return safeJsonRoute(async () => {
    const session = await requireServerSession();
    const body = await request.json();
    const id = await registerDeviceToken(session.user.id, body);

    return { id };
  }, { fallbackMessage: "Gagal mendaftarkan perangkat notifikasi." });
}

export async function DELETE(request: Request) {
  return safeJsonRoute(async () => {
    const session = await requireServerSession();
    const body = await request.json();
    await revokeDeviceToken(session.user.id, body);

    return { ok: true };
  }, { fallbackMessage: "Gagal menghapus perangkat notifikasi." });
}
