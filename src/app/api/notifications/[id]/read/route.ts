import { NextResponse } from "next/server";

import { markNotificationRead } from "@/src/features/notifications";
import { requireServerSession } from "@/src/infrastructure/auth";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireServerSession();
  const { id } = await params;
  await markNotificationRead(session.user.id, { notificationId: id });

  return NextResponse.json({ ok: true });
}
