"use client";

import { useActionState } from "react";
import { Archive, Plus, Save, UserPlus } from "lucide-react";

import type {
  DepartmentListItem,
  DepartmentMemberItem,
} from "../application/contracts";
import { departmentRoles } from "../domain/department-policy";
import {
  addDepartmentMemberAction,
  archiveDepartmentAction,
  createDepartmentAction,
  removeDepartmentMemberAction,
  updateDepartmentAction,
  updateDepartmentMemberAction,
} from "../server/department-actions";

const initialState = { ok: true, message: "" };

type AssignableUser = {
  id: string;
  name: string;
  email: string;
  displayName: string | null;
};

function ActionMessage({ state }: { state: typeof initialState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
      {state.message}
    </p>
  );
}

export function CreateDepartmentForm() {
  const [state, formAction, isPending] = useActionState(
    createDepartmentAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-[120px_1fr_2fr_auto]">
      <input
        name="code"
        placeholder="Kode"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        required
      />
      <input
        name="name"
        placeholder="Nama departemen"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        required
      />
      <input
        name="description"
        placeholder="Deskripsi singkat"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--simadep-foreground)] disabled:opacity-60">
        <Plus className="h-4 w-4" />
        Buat
      </button>
      <div className="md:col-span-4">
        <ActionMessage state={state} />
      </div>
    </form>
  );
}

export function DepartmentEditForm({
  department,
}: {
  department: DepartmentListItem;
}) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateDepartmentAction,
    initialState,
  );
  const [archiveState, archiveAction, isArchiving] = useActionState(
    archiveDepartmentAction,
    initialState,
  );

  return (
    <div className="space-y-3">
      <form action={updateAction} className="grid gap-3 md:grid-cols-[120px_1fr_auto]">
        <input type="hidden" name="departmentId" value={department.id} />
        <input
          name="code"
          defaultValue={department.code}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required
        />
        <input
          name="name"
          defaultValue={department.name}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={isUpdating}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60">
          <Save className="h-4 w-4" />
          Simpan
        </button>
        <textarea
          name="description"
          defaultValue={department.description ?? ""}
          rows={2}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-3"
        />
        <div className="md:col-span-3">
          <ActionMessage state={updateState} />
        </div>
      </form>

      {department.status === "active" && (
        <form action={archiveAction}>
          <input type="hidden" name="departmentId" value={department.id} />
          <button
            type="submit"
            disabled={isArchiving}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-60">
            <Archive className="h-4 w-4" />
            Arsipkan
          </button>
          <ActionMessage state={archiveState} />
        </form>
      )}
    </div>
  );
}

export function DepartmentMembersPanel({
  department,
  members,
  users,
}: {
  department: DepartmentListItem;
  members: DepartmentMemberItem[];
  users: AssignableUser[];
}) {
  const [addState, addAction, isAdding] = useActionState(
    addDepartmentMemberAction,
    initialState,
  );

  return (
    <div className="space-y-4">
      <form
        action={addAction}
        className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
        <input type="hidden" name="departmentId" value={department.id} />
        <select
          name="userId"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required>
          <option value="">Pilih pengguna</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName ?? user.name} - {user.email}
            </option>
          ))}
        </select>
        <select
          name="role"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          defaultValue="member">
          {departmentRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isAdding}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-secondary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          <UserPlus className="h-4 w-4" />
          Tambah
        </button>
        <div className="md:col-span-3">
          <ActionMessage state={addState} />
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-gray-500">
              <th className="py-2 pr-4">Nama</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <DepartmentMemberRow
                key={member.id}
                departmentId={department.id}
                member={member}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DepartmentMemberRow({
  departmentId,
  member,
}: {
  departmentId: string;
  member: DepartmentMemberItem;
}) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateDepartmentMemberAction,
    initialState,
  );
  const [removeState, removeAction, isRemoving] = useActionState(
    removeDepartmentMemberAction,
    initialState,
  );

  return (
    <tr className="border-b align-top">
      <td className="py-3 pr-4">
        <p className="font-semibold">{member.displayName ?? member.userId}</p>
        <p className="text-xs text-gray-500">{member.email}</p>
        <ActionMessage state={updateState} />
        <ActionMessage state={removeState} />
      </td>
      <td className="py-3 pr-4">
        <form action={updateAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="departmentId" value={departmentId} />
          <input type="hidden" name="memberId" value={member.id} />
          <select
            name="role"
            defaultValue={member.role}
            className="rounded-lg border border-gray-200 px-2 py-1">
            {departmentRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={member.status}
            className="rounded-lg border border-gray-200 px-2 py-1">
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <button
            type="submit"
            disabled={isUpdating}
            className="rounded-lg border border-gray-200 px-3 py-1 font-semibold hover:bg-gray-50 disabled:opacity-60">
            Simpan
          </button>
        </form>
      </td>
      <td className="py-3 pr-4">{member.status}</td>
      <td className="py-3 pr-4">
        <form action={removeAction}>
          <input type="hidden" name="departmentId" value={departmentId} />
          <input type="hidden" name="memberId" value={member.id} />
          <button
            type="submit"
            disabled={isRemoving || member.status === "inactive"}
            className="rounded-lg border border-red-200 px-3 py-1 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
            Nonaktifkan
          </button>
        </form>
      </td>
    </tr>
  );
}
