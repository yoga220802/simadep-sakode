"use server";

import { revalidatePath } from "next/cache";

import { requireServerSession } from "@/src/infrastructure/auth";
import { setGlobalRole } from "../use-cases";

export async function setGlobalRoleAction(formData: FormData) {
  const session = await requireServerSession();
  const targetUserId = String(formData.get("targetUserId") ?? "");
  const role = String(formData.get("role") ?? "");

  await setGlobalRole(
    {
      id: session.user.id,
      role: session.user.role,
    },
    {
      targetUserId,
      role: role as "super_admin" | "admin" | "user",
    },
  );

  revalidatePath("/users");
}
