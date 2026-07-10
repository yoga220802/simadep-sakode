"use server";

import { revalidatePath } from "next/cache";

import { requireServerSession } from "@/src/infrastructure/auth";
import { createManagedUser, setGlobalRole } from "../use-cases";
import type { UserActionResult } from "./action-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(formData: FormData, key: string) {
  return getString(formData, key) || undefined;
}

async function getActorFromSession() {
  const session = await requireServerSession();
  return {
    id: session.user.id,
    role: session.user.role,
  };
}

export async function createManagedUserAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  try {
    await createManagedUser(await getActorFromSession(), {
      email: getString(formData, "email"),
      name: getString(formData, "name"),
      password: getString(formData, "password"),
      role: getString(formData, "role") as never,
      employeeNumber: optionalString(formData, "employeeNumber"),
      displayName: optionalString(formData, "displayName"),
      position: optionalString(formData, "position"),
      workUnit: optionalString(formData, "workUnit"),
      phone: optionalString(formData, "phone"),
    });

    revalidatePath("/users");
    return { ok: true, message: "User baru berhasil ditambahkan." };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Gagal menambahkan user.",
    };
  }
}

export async function setGlobalRoleAction(formData: FormData) {
  const targetUserId = getString(formData, "targetUserId");
  const role = getString(formData, "role");

  await setGlobalRole(
    await getActorFromSession(),
    {
      targetUserId,
      role: role as "super_admin" | "admin" | "user",
    },
  );

  revalidatePath("/users");
}
