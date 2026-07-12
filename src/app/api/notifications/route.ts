import { NextResponse } from "next/server";

import {
  listNotificationInbox,
  markAllNotificationsRead,
} from "@/src/features/notifications";
import { requireServerSession } from "@/src/infrastructure/auth";

export async function GET(request: Request) {
  const session = await requireServerSession();
  const url = new URL(request.url);
  const limit = url.searchParams.get("limit") ?? undefined;
  const inbox = await listNotificationInbox(session.user.id, { limit });

  return NextResponse.json(inbox);
}

export async function PATCH() {
  const session = await requireServerSession();
  await markAllNotificationsRead(session.user.id);

  return NextResponse.json({ ok: true });
}
