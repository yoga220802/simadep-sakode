import { NextResponse } from "next/server";

import { requireServerSession } from "@/src/infrastructure/auth";
import {
  getProjectActor,
  listAssignableProjectUsers,
} from "@/src/features/projects";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await requireServerSession();
  const { id } = await context.params;
  const url = new URL(request.url);
  const actor = await getProjectActor(session.user.id);

  try {
    const users = await listAssignableProjectUsers(actor, id, {
      search: url.searchParams.get("q") ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1"),
      pageSize: Number(url.searchParams.get("pageSize") ?? "20"),
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cannot load users." },
      { status: 403 },
    );
  }
}
