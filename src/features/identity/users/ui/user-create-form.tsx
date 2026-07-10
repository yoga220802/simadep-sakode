"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";

import { createManagedUserAction } from "../server/user-actions";
import { userActionInitialState } from "../server/action-state";

export function UserCreateForm() {
  const [state, action, isPending] = useActionState(
    createManagedUserAction,
    userActionInitialState,
  );

  return (
    <form
      action={action}
      className="mb-6 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="xl:col-span-4">
        <h2 className="text-base font-bold text-[var(--color-text-main)]">
          Tambah User
        </h2>
      </div>

      <input
        name="name"
        placeholder="Nama lengkap"
        className="rounded-md border border-gray-200 px-3 py-2 text-sm"
        required
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="rounded-md border border-gray-200 px-3 py-2 text-sm"
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password awal"
        minLength={8}
        className="rounded-md border border-gray-200 px-3 py-2 text-sm"
        required
      />
      <select
        name="role"
        defaultValue="user"
        className="rounded-md border border-gray-200 px-3 py-2 text-sm">
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="super_admin">Super Admin</option>
      </select>

      <input
        name="employeeNumber"
        placeholder="Nomor pegawai"
        className="rounded-md border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="position"
        placeholder="Jabatan"
        className="rounded-md border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="workUnit"
        placeholder="Unit kerja"
        className="rounded-md border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="phone"
        placeholder="Telepon"
        className="rounded-md border border-gray-200 px-3 py-2 text-sm"
      />

      <div className="flex flex-wrap items-center gap-3 xl:col-span-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--simadep-foreground)] disabled:opacity-60">
          <UserPlus className="h-4 w-4" />
          Tambah User
        </button>
        {state.message ? (
          <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
