import { NextResponse } from "next/server";

import { getNavigationCapabilitiesForUser } from "@/src/features/navigation/application/navigation-capabilities";
import { requireServerSession } from "@/src/infrastructure/auth";

export async function GET() {
  const session = await requireServerSession();
  const capabilities = await getNavigationCapabilitiesForUser(session.user.id);

  return NextResponse.json(capabilities);
}
