import { NextResponse } from "next/server";

import {
  registerDeviceToken,
  revokeDeviceToken,
} from "@/src/features/notifications";
import { requireServerSession } from "@/src/infrastructure/auth";

export async function POST(request: Request) {
  const session = await requireServerSession();
  const body = await request.json();
  const id = await registerDeviceToken(session.user.id, body);

  return NextResponse.json({ id });
}

export async function DELETE(request: Request) {
  const session = await requireServerSession();
  const body = await request.json();
  await revokeDeviceToken(session.user.id, body);

  return NextResponse.json({ ok: true });
}
