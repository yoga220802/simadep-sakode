"use client";

import { useActionState } from "react";
import { Archive, Save, UserPlus } from "lucide-react";

import { projectRoles, projectStatuses } from "../domain/project-policy";
import type { ProjectDetail, ProjectMemberItem } from "../application/contracts";
import {
  addProjectMemberAction,
  archiveProjectAction,
  createProjectAction,
  removeProjectMemberAction,
  updateProjectAction,
  updateProjectMemberAction,
} from "../server/project-actions";
import { projectActionInitialState } from "../server/action-state";

type AssignableUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function ActionMessage({ state }: { state: typeof projectActionInitialState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
      {state.message}
    </p>
  );
}

function toDateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function ProjectCreateForm({
  departments,
}: {
  departments: Array<{ id: string; name: string; code: string }>;
}) {
  return (
    <form
      action={createProjectAction}
      className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_160px]">
      <select
        name="departmentId"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        required>
        <option value="">Departemen</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name} ({department.code})
          </option>
        ))}
      </select>
      <input
        name="title"
        placeholder="Nama project"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        required
      />
      <select
        name="status"
        defaultValue="tender"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
        {projectStatuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      <input
        name="startDate"
        type="date"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        name="endDate"
        type="date"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--simadep-foreground)]">
        Buat Project
      </button>
      <textarea
        name="description"
        placeholder="Deskripsi"
        rows={2}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-3"
      />
    </form>
  );
}

export function ProjectEditForm({ project }: { project: ProjectDetail }) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateProjectAction,
    projectActionInitialState,
  );
  const [archiveState, archiveAction, isArchiving] = useActionState(
    archiveProjectAction,
    projectActionInitialState,
  );

  return (
    <div className="space-y-4">
      <form action={updateAction} className="grid gap-3 md:grid-cols-[1fr_160px]">
        <input type="hidden" name="projectId" value={project.id} />
        <input type="hidden" name="version" value={project.version} />
        <input
          name="title"
          defaultValue={project.title}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required
        />
        <select
          name="status"
          defaultValue={project.status}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          {projectStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          name="startDate"
          type="date"
          defaultValue={toDateInput(project.startDate)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          name="endDate"
          type="date"
          defaultValue={toDateInput(project.endDate)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <textarea
          name="description"
          defaultValue={project.description ?? ""}
          rows={4}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
        />
        <button
          type="submit"
          disabled={isUpdating}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60">
          <Save className="h-4 w-4" />
          Simpan Project
        </button>
        <ActionMessage state={updateState} />
      </form>

      <form action={archiveAction}>
        <input type="hidden" name="projectId" value={project.id} />
        <button
          type="submit"
          disabled={isArchiving}
          className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-60">
          <Archive className="h-4 w-4" />
          Arsipkan Project
        </button>
        <ActionMessage state={archiveState} />
      </form>
    </div>
  );
}

export function ProjectMembersPanel({
  projectId,
  members,
  users,
}: {
  projectId: string;
  members: ProjectMemberItem[];
  users: AssignableUser[];
}) {
  const [addState, addAction, isAdding] = useActionState(
    addProjectMemberAction,
    projectActionInitialState,
  );

  return (
    <div className="space-y-4">
      <form action={addAction} className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
        <input type="hidden" name="projectId" value={projectId} />
        <select
          name="userId"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required>
          <option value="">Pilih pengguna</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} - {user.email}
            </option>
          ))}
        </select>
        <select
          name="role"
          defaultValue="contributor"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
          {projectRoles.map((role) => (
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
              <th className="py-2 pr-4">Pengguna</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <ProjectMemberRow
                key={member.id}
                projectId={projectId}
                member={member}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectMemberRow({
  projectId,
  member,
}: {
  projectId: string;
  member: ProjectMemberItem;
}) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateProjectMemberAction,
    projectActionInitialState,
  );
  const [removeState, removeAction, isRemoving] = useActionState(
    removeProjectMemberAction,
    projectActionInitialState,
  );

  return (
    <tr className="border-b align-top">
      <td className="py-3 pr-4">
        <p className="font-semibold">{member.name ?? member.userId}</p>
        <p className="text-xs text-gray-500">{member.email}</p>
        <ActionMessage state={updateState} />
        <ActionMessage state={removeState} />
      </td>
      <td className="py-3 pr-4">
        <form action={updateAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="memberId" value={member.id} />
          <select
            name="role"
            defaultValue={member.role}
            className="rounded-lg border border-gray-200 px-2 py-1">
            {projectRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isUpdating}
            className="rounded-lg border border-gray-200 px-3 py-1 font-semibold hover:bg-gray-50 disabled:opacity-60">
            Simpan
          </button>
        </form>
      </td>
      <td className="py-3 pr-4">
        <form action={removeAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="memberId" value={member.id} />
          <button
            type="submit"
            disabled={isRemoving || member.role === "owner"}
            className="rounded-lg border border-red-200 px-3 py-1 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
            Hapus
          </button>
        </form>
      </td>
    </tr>
  );
}
