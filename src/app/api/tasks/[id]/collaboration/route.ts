import { NextResponse } from "next/server";

import { requireServerSession } from "@/src/infrastructure/auth";
import { getProjectActor } from "@/src/features/projects";
import { listTaskCollaboration } from "@/src/features/collaboration";
import { getUserSafeErrorMessage } from "@/src/shared/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireServerSession();
  const { id } = await context.params;
  const actor = await getProjectActor(session.user.id);

  try {
    return NextResponse.json(await listTaskCollaboration(actor, id));
  } catch (error) {
    return NextResponse.json(
      { error: getUserSafeErrorMessage(error, "Gagal memuat diskusi tugas.") },
      { status: 403 },
    );
  }
}
