import { NextResponse } from "next/server";

import { requireServerSession } from "@/src/infrastructure/auth";
import { processOutboxBatch } from "@/src/infrastructure/events";

export async function POST() {
  const session = await requireServerSession();

  if (session.user.role !== "super_admin" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const result = await processOutboxBatch();

  return NextResponse.json(result);
}
