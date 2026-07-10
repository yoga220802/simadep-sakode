import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/src/infrastructure/db";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("ready") !== "1") {
    return NextResponse.json({
      status: "ok",
      service: "simadep",
      checks: { liveness: "ok" },
    });
  }

  try {
    await getDb().execute(sql`select 1`);
    return NextResponse.json({
      status: "ok",
      service: "simadep",
      checks: { liveness: "ok", database: "ok" },
    });
  } catch {
    return NextResponse.json(
      {
        status: "unavailable",
        service: "simadep",
        checks: { liveness: "ok", database: "error" },
      },
      { status: 503 },
    );
  }
}
