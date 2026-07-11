"use client";

import { useState } from "react";
import { Archive, Edit3, Filter, Plus, Users } from "lucide-react";

import type {
  DepartmentListItem,
  DepartmentMemberItem,
} from "../application/contracts";
import {
  CreateDepartmentForm,
  DepartmentEditForm,
  DepartmentMembersPanel,
} from "./department-forms";

type AssignableUser = {
  id: string;
  name: string;
  email: string;
  displayName: string | null;
};

type DepartmentsManagementViewProps = {
  departments: DepartmentListItem[];
  membersByDepartment: Record<string, DepartmentMemberItem[]>;
  users: AssignableUser[];
  filters: {
    q?: string;
    status?: string;
  };
  canCreateDepartment: boolean;
};

function DialogShell({
  title,
  children,
  onClose,
  maxWidth = "max-w-3xl",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className={`w-full ${maxWidth} rounded-lg bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold text-[var(--color-text-main)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm font-semibold text-gray-500 hover:bg-gray-100"
          >
            Tutup
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

function roleLabel(role: string | null | undefined) {
  if (!role) return "Tidak ada akses langsung";
  if (role === "department_admin") return "Admin Departemen";
  if (role === "head") return "Head";
  if (role === "viewer") return "Viewer";
  return "Member";
}

export function DepartmentsManagementView({
  departments,
  membersByDepartment,
  users,
  filters,
  canCreateDepartment,
}: DepartmentsManagementViewProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editDepartment, setEditDepartment] =
    useState<DepartmentListItem | null>(null);
  const [memberDepartment, setMemberDepartment] =
    useState<DepartmentListItem | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">
            Departemen
          </h1>
          <p className="text-sm text-gray-500">
            Kelola struktur departemen, role anggota, dan akses lingkup kerja.
          </p>
        </div>
        {canCreateDepartment && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--simadep-foreground)]"
          >
            <Plus className="h-4 w-4" />
            Buat Departemen
          </button>
        )}
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <form
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]"
          action="/departments"
        >
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Cari departemen"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={filters.status ?? "active"}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="active">Aktif</option>
            <option value="archived">Arsip</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {departments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Tidak ada departemen sesuai filter.
          </div>
        ) : (
          departments.map((department) => (
            <article
              key={department.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-[var(--color-text-main)]">
                      {department.name}
                    </h2>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                      {department.code}
                    </span>
                    <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      {roleLabel(department.actorRole)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        department.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {department.status === "active" ? "Aktif" : "Arsip"}
                    </span>
                  </div>
                  <p className="mt-1 max-w-3xl text-sm text-gray-500">
                    {department.description ?? "Belum ada deskripsi."}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {department.memberCount} anggota aktif, {department.headCount} head aktif
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDepartment(department)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberDepartment(department)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                  >
                    <Users className="h-4 w-4" />
                    Anggota
                  </button>
                  {department.status === "archived" && (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700">
                      <Archive className="h-4 w-4" />
                      Diarsipkan
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {createOpen && (
        <DialogShell title="Buat Departemen" onClose={() => setCreateOpen(false)}>
          <CreateDepartmentForm />
        </DialogShell>
      )}

      {editDepartment && (
        <DialogShell
          title={`Edit ${editDepartment.name}`}
          onClose={() => setEditDepartment(null)}
        >
          <DepartmentEditForm department={editDepartment} />
        </DialogShell>
      )}

      {memberDepartment && (
        <DialogShell
          title={`Anggota ${memberDepartment.name}`}
          onClose={() => setMemberDepartment(null)}
          maxWidth="max-w-5xl"
        >
          <DepartmentMembersPanel
            department={memberDepartment}
            members={membersByDepartment[memberDepartment.id] ?? []}
            users={users}
          />
        </DialogShell>
      )}
    </div>
  );
}
