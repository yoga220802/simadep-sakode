"use server";

import { revalidatePath } from "next/cache";

import { requireServerSession } from "@/src/infrastructure/auth";
import { getStorageAdapter } from "@/src/infrastructure/storage";
import {
  maxUploadFileSizeBytes,
  maxUploadFileSizeLabel,
} from "@/src/shared/upload-limits";
import {
  banManagedUser,
  bulkCreateManagedUsers,
  createManagedUser,
  resetManagedUserPassword,
  revokeManagedUserSessions,
  setGlobalRole,
  unbanManagedUser,
  updateOwnPassword,
  updateUserProfile,
} from "../use-cases";
import type { UserActionResult } from "./action-state";
import { defaultManagedUserPassword } from "../types";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(formData: FormData, key: string) {
  return getString(formData, key) || undefined;
}

function nullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
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
      password: optionalString(formData, "password") ?? defaultManagedUserPassword,
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

type ImportedUserRow = {
  email: string;
  name: string;
  role?: string;
  employeeNumber?: string;
  displayName?: string;
  position?: string;
  workUnit?: string;
  phone?: string;
};

const importHeaders: Array<keyof ImportedUserRow> = [
  "email",
  "name",
  "role",
  "employeeNumber",
  "displayName",
  "position",
  "workUnit",
  "phone",
];

function splitCsvLine(line: string, delimiter: "," | "\t") {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseImportText(text: string): ImportedUserRow[] {
  const normalized = text.replace(/^\uFEFF/, "").trim();
  if (!normalized) {
    throw new Error("File import kosong.");
  }

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const delimiter = lines[0]?.includes("\t") ? "\t" : ",";
  const headers = splitCsvLine(lines[0], delimiter).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? "";
    });

    return Object.fromEntries(
      importHeaders.map((key) => [key, row[key] || undefined]),
    ) as ImportedUserRow;
  });

  return rows.filter((row) => row.email || row.name);
}

export async function bulkCreateManagedUsersAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("File CSV/XLS wajib diunggah.");
    }
    if (file.size > maxUploadFileSizeBytes) {
      throw new Error(`File import maksimal ${maxUploadFileSizeLabel}.`);
    }

    const rows = parseImportText(await file.text());
    await bulkCreateManagedUsers(await getActorFromSession(), {
      users: rows.map((row) => ({
        email: row.email,
        name: row.name,
        password: defaultManagedUserPassword,
        role: (row.role || "user") as never,
        employeeNumber: row.employeeNumber,
        displayName: row.displayName,
        position: row.position,
        workUnit: row.workUnit,
        phone: row.phone,
      })),
    });

    revalidatePath("/users");
    return {
      ok: true,
      message: `${rows.length} user berhasil dibuat. Password default: ${defaultManagedUserPassword}`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal import user.",
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

export async function updateManagedUserProfileAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  return runUserAction(async () => {
    await updateUserProfile(await getActorFromSession(), {
      userId: getString(formData, "targetUserId"),
      name: getString(formData, "name"),
      email: optionalString(formData, "email"),
      employeeNumber: nullableString(formData, "employeeNumber"),
      displayName: getString(formData, "displayName"),
      position: nullableString(formData, "position"),
      workUnit: nullableString(formData, "workUnit"),
      phone: nullableString(formData, "phone"),
      avatarUrl: optionalString(formData, "avatarUrl") ?? null,
    });
  }, "Profil user diperbarui.", "Gagal memperbarui profil user.");
}

export async function updateOwnProfileAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  try {
    const session = await requireServerSession();
    let avatarUrl = optionalString(formData, "avatarUrl") ?? null;
    const avatar = formData.get("avatar");

    if (avatar instanceof File && avatar.size > 0) {
      if (!avatar.type.startsWith("image/")) {
        throw new Error("Foto profil harus berupa gambar.");
      }
      if (avatar.size > maxUploadFileSizeBytes) {
        throw new Error(`Foto profil maksimal ${maxUploadFileSizeLabel}.`);
      }

      const upload = await getStorageAdapter().upload({
        folder: `profiles/${session.user.id}`,
        fileName: avatar.name,
        mimeType: avatar.type,
        buffer: Buffer.from(await avatar.arrayBuffer()),
      });
      avatarUrl = upload.publicUrl;
    }

    await updateUserProfile(
      { id: session.user.id, role: session.user.role },
      {
        userId: session.user.id,
        name: getString(formData, "name"),
        employeeNumber: nullableString(formData, "employeeNumber"),
        displayName: getString(formData, "displayName"),
        position: nullableString(formData, "position"),
        workUnit: nullableString(formData, "workUnit"),
        phone: nullableString(formData, "phone"),
        avatarUrl,
      },
    );

    revalidatePath("/profile");
    revalidatePath("/users");
    return { ok: true, message: "Profil diperbarui." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal memperbarui profil.",
    };
  }
}

export async function updateOwnPasswordAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  try {
    const session = await requireServerSession();
    await updateOwnPassword(
      { id: session.user.id, role: session.user.role },
      {
        userId: session.user.id,
        currentPassword: getString(formData, "currentPassword"),
        newPassword: getString(formData, "newPassword"),
      },
    );

    revalidatePath("/profile");
    return {
      ok: true,
      message: "Password diperbarui. Silakan login ulang.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Gagal memperbarui password.",
    };
  }
}

export async function resetManagedUserPasswordAction(
  _previousState: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  return runUserAction(async () => {
    await resetManagedUserPassword(await getActorFromSession(), {
      targetUserId: getString(formData, "targetUserId"),
      password: defaultManagedUserPassword,
    });
  }, `Password direset ke ${defaultManagedUserPassword}.`, "Gagal reset password.");
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
