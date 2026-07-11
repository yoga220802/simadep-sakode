"use server";

import { revalidatePath } from "next/cache";

import { requireServerSession } from "@/src/infrastructure/auth";
import {
  banManagedUser,
  createManagedUser,
  revokeManagedUserSessions,
  setGlobalRole,
  unbanManagedUser,
} from "../use-cases";
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

async function runUserAction(
  action: () => Promise<void>,
  successMessage: string,
  failureMessage: string,
): Promise<UserActionResult> {
  try {
    await action();
    revalidatePath("/users");
    return { ok: true, message: successMessage };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : failureMessage,
    };
  }
}

export async function setGlobalRoleAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  return runUserAction(async () => {
    const targetUserId = getString(formData, "targetUserId");
    const role = getString(formData, "role");

    await setGlobalRole(await getActorFromSession(), {
      targetUserId,
      role: role as "super_admin" | "admin" | "user",
    });
  }, "Role user diperbarui.", "Gagal memperbarui role user.");
}

export async function banManagedUserAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  return runUserAction(async () => {
    await banManagedUser(await getActorFromSession(), {
      targetUserId: getString(formData, "targetUserId"),
      reason: optionalString(formData, "reason"),
    });
  }, "User dinonaktifkan.", "Gagal menonaktifkan user.");
}

export async function unbanManagedUserAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  return runUserAction(async () => {
    await unbanManagedUser(await getActorFromSession(), {
      targetUserId: getString(formData, "targetUserId"),
    });
  }, "User diaktifkan kembali.", "Gagal mengaktifkan user.");
}

export async function revokeManagedUserSessionsAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  return runUserAction(async () => {
    await revokeManagedUserSessions(await getActorFromSession(), {
      targetUserId: getString(formData, "targetUserId"),
    });
  }, "Sesi user dicabut.", "Gagal mencabut sesi user.");
}
