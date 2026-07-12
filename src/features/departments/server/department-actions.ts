"use server";

import { revalidatePath } from "next/cache";

import { requireServerSession } from "@/src/infrastructure/auth";
import { getUserSafeErrorMessage } from "@/src/shared/errors";

import {
  addDepartmentMember,
  archiveDepartment,
  createDepartment,
  getDepartmentActor,
  removeDepartmentMember,
  updateDepartment,
  updateDepartmentMember,
} from "../application/department-use-cases";

type ActionResult = {
  ok: boolean;
  message: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getActorFromSession() {
  const session = await requireServerSession();
  return getDepartmentActor(session.user.id);
}

async function runDepartmentAction(
  action: () => Promise<void>,
  successMessage: string,
): Promise<ActionResult> {
  try {
    await action();
    revalidatePath("/departments");
    return { ok: true, message: successMessage };
  } catch (error) {
    return {
      ok: false,
      message: getUserSafeErrorMessage(error, "Aksi departemen gagal."),
    };
  }
}

export async function createDepartmentAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runDepartmentAction(async () => {
    await createDepartment(await getActorFromSession(), {
      code: getString(formData, "code"),
      name: getString(formData, "name"),
      description: getString(formData, "description") || undefined,
    });
  }, "Departemen dibuat.");
}

export async function updateDepartmentAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runDepartmentAction(async () => {
    await updateDepartment(await getActorFromSession(), {
      departmentId: getString(formData, "departmentId"),
      code: getString(formData, "code"),
      name: getString(formData, "name"),
      description: getString(formData, "description") || undefined,
    });
  }, "Departemen diperbarui.");
}

export async function archiveDepartmentAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runDepartmentAction(async () => {
    await archiveDepartment(await getActorFromSession(), {
      departmentId: getString(formData, "departmentId"),
    });
  }, "Departemen diarsipkan.");
}

export async function addDepartmentMemberAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runDepartmentAction(async () => {
    await addDepartmentMember(await getActorFromSession(), {
      departmentId: getString(formData, "departmentId"),
      userId: getString(formData, "userId"),
      role: getString(formData, "role") as never,
    });
  }, "Anggota departemen ditambahkan.");
}

export async function updateDepartmentMemberAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runDepartmentAction(async () => {
    await updateDepartmentMember(await getActorFromSession(), {
      departmentId: getString(formData, "departmentId"),
      memberId: getString(formData, "memberId"),
      role: getString(formData, "role") as never,
      status: getString(formData, "status") as never,
    });
  }, "Anggota departemen diperbarui.");
}

export async function removeDepartmentMemberAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runDepartmentAction(async () => {
    await removeDepartmentMember(await getActorFromSession(), {
      departmentId: getString(formData, "departmentId"),
      memberId: getString(formData, "memberId"),
    });
  }, "Anggota departemen dinonaktifkan.");
}
