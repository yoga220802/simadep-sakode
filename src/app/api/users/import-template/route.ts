import { NextRequest, NextResponse } from "next/server";

import { defaultManagedUserPassword } from "@/src/features/identity/users";
import { requireServerSession } from "@/src/infrastructure/auth";

const headers = [
  "email",
  "name",
  "role",
  "employeeNumber",
  "displayName",
  "position",
  "workUnit",
  "phone",
];

const example = [
  "pegawai@example.com",
  "Nama Pegawai",
  "user",
  "EMP-001",
  "Nama Pegawai",
  "Staff",
  "Departemen Operasional",
  "08123456789",
];

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET(request: NextRequest) {
  const session = await requireServerSession().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "super_admin" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format");
  const isExcel = format === "xls";
  const delimiter = isExcel ? "\t" : ",";
  const body = [
    headers.map(csvEscape).join(delimiter),
    example.map(csvEscape).join(delimiter),
    `# Password default semua user: ${defaultManagedUserPassword}`,
  ].join("\r\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": isExcel
        ? "application/vnd.ms-excel; charset=utf-8"
        : "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="simadep-user-import-template.${isExcel ? "xls" : "csv"}"`,
    },
  });
}
