"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useActionState } from "react";
import {
  Ban,
  Filter,
  KeyRound,
  Plus,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import type { UserActionResult } from "../server/action-state";
import {
  banManagedUserAction,
  createManagedUserAction,
  revokeManagedUserSessionsAction,
  setGlobalRoleAction,
  unbanManagedUserAction,
} from "../server/user-actions";

type ManagedUser = {
  id: string;
  email: string;
  name: string;
  role: string | null;
  banned: boolean | null;
  banReason: string | null;
  employeeNumber: string | null;
  displayName: string | null;
  position: string | null;
  workUnit: string | null;
};

type UsersManagementViewProps = {
  users: ManagedUser[];
  currentUserId: string;
  filters: {
    q?: string;
    role?: string;
    status?: string;
  };
};

const initialState: UserActionResult = { ok: true, message: "" };

function roleLabel(role: string | null | undefined) {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  return "User";
}

function roleBadgeClass(role: string | null | undefined) {
  if (role === "super_admin") return "bg-purple-50 text-purple-700";
  if (role === "admin") return "bg-sky-50 text-sky-700";
  return "bg-gray-100 text-gray-700";
}

function ActionMessage({ state }: { state: UserActionResult }) {
  if (!state.message) return null;

  return (
    <p className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
      {state.message}
    </p>
  );
}

function DialogShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  }, []);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapFocus}
        className="w-full max-w-2xl rounded-lg bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 id={titleId} className="text-lg font-bold text-[var(--color-text-main)]">
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
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function CreateUserModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    createManagedUserAction,
    initialState,
  );

  if (!isOpen) return null;

  return (
    <DialogShell title="Tambah User" onClose={onClose}>
      <form action={formAction} className="grid gap-3 md:grid-cols-2">
        <input
          aria-label="Nama akun"
          name="name"
          placeholder="Nama akun"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required
        />
        <input
          aria-label="Email"
          name="email"
          type="email"
          placeholder="Email"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required
        />
        <input
          aria-label="Password awal"
          name="password"
          type="password"
          placeholder="Password awal"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          required
        />
        <select
          aria-label="Role global"
          name="role"
          defaultValue="user"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <input
          aria-label="NIP atau nomor pegawai"
          name="employeeNumber"
          placeholder="NIP/Nomor pegawai"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          aria-label="Nama tampilan"
          name="displayName"
          placeholder="Nama tampilan"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          aria-label="Jabatan"
          name="position"
          placeholder="Jabatan"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          aria-label="Unit kerja"
          name="workUnit"
          placeholder="Unit kerja"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          aria-label="Telepon"
          name="phone"
          placeholder="Telepon"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
        />
        <div className="flex flex-col gap-3 md:col-span-2">
          <ActionMessage state={state} />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--simadep-foreground)] disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              Tambah User
            </button>
          </div>
        </div>
      </form>
    </DialogShell>
  );
}

function ConfirmActionForm({
  userId,
  label,
  title,
  description,
  action,
  icon,
  tone = "neutral",
  hiddenFields,
  disabled,
}: {
  userId: string;
  label: string;
  title: string;
  description: string;
  action: (
    previousState: UserActionResult,
    formData: FormData,
  ) => Promise<UserActionResult>;
  icon: React.ReactNode;
  tone?: "neutral" | "danger";
  hiddenFields?: Record<string, string>;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const buttonClass =
    tone === "danger"
      ? "text-red-700 hover:bg-red-50"
      : "text-gray-700 hover:bg-gray-50";

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:text-gray-300 ${buttonClass}`}
      >
        {icon}
        {label}
      </button>
      {isOpen && (
        <DialogShell title={title} onClose={() => setIsOpen(false)}>
          <form action={formAction} className="space-y-4">
            <p className="text-sm text-gray-600">{description}</p>
            <input type="hidden" name="targetUserId" value={userId} />
            {hiddenFields
              ? Object.entries(hiddenFields).map(([name, value]) => (
                  <input key={name} type="hidden" name={name} value={value} />
                ))
              : null}
            {tone === "danger" && (
              <textarea
                aria-label="Alasan penonaktifan"
                name="reason"
                rows={3}
                placeholder="Alasan penonaktifan"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            )}
            <ActionMessage state={state} />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={`rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-60 ${
                  tone === "danger"
                    ? "bg-red-600"
                    : "bg-[var(--color-primary)]"
                }`}
              >
                Konfirmasi
              </button>
            </div>
          </form>
        </DialogShell>
      )}
    </>
  );
}

function RoleChangeControl({
  user,
  disabled,
}: {
  user: ManagedUser;
  disabled: boolean;
}) {
  const [nextRole, setNextRole] = useState(user.role ?? "user");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label={`Role global ${user.displayName ?? user.name}`}
        value={nextRole}
        onChange={(event) => setNextRole(event.target.value)}
        disabled={disabled}
        className="rounded-md border border-gray-200 px-2 py-1 text-xs disabled:bg-gray-100"
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="super_admin">Super Admin</option>
      </select>
      <ConfirmActionForm
        userId={user.id}
        label="Simpan"
        title="Ubah Role Global"
        description={`Role ${user.displayName ?? user.name} akan diubah menjadi ${roleLabel(nextRole)}.`}
        action={setGlobalRoleAction}
        hiddenFields={{ role: nextRole }}
        icon={<ShieldCheck className="h-3.5 w-3.5" />}
        disabled={disabled || nextRole === user.role}
      />
    </div>
  );
}

export function UsersManagementView({
  users,
  currentUserId,
  filters,
}: UsersManagementViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const totalActive = useMemo(
    () => users.filter((user) => !user.banned).length,
    [users],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">
            Pegawai
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola akun, role global, status akses, dan sesi pengguna SIMADEP.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--simadep-foreground)]"
        >
          <Plus className="h-4 w-4" />
          Tambah User
        </button>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_160px_auto]">
          <input
            aria-label="Cari user"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="Cari nama, email, jabatan, unit"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <select
            aria-label="Filter role global"
            name="role"
            defaultValue={filters.role ?? ""}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Semua role</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select
            aria-label="Filter status user"
            name="status"
            defaultValue={filters.status ?? ""}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Semua status</option>
            <option value="active">Aktif</option>
            <option value="banned">Nonaktif</option>
          </select>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
          <span>{users.length} user ditampilkan</span>
          <span>{totalActive} aktif</span>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Pegawai</th>
                <th className="px-4 py-3">Jabatan/Unit</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada user sesuai filter.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === currentUserId;

                  return (
                    <tr key={user.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">
                          {user.displayName ?? user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.employeeNumber && (
                          <p className="text-xs text-gray-400">
                            {user.employeeNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <p>{user.position ?? "-"}</p>
                        <p className="text-xs text-gray-500">
                          {user.workUnit ?? "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${roleBadgeClass(user.role)}`}
                        >
                          {roleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${
                            user.banned
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {user.banned ? "Nonaktif" : "Aktif"}
                        </span>
                        {user.banReason && (
                          <p className="mt-1 max-w-44 text-xs text-gray-500">
                            {user.banReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-md flex-col gap-2">
                          <RoleChangeControl user={user} disabled={isSelf} />
                          <div className="flex flex-wrap gap-1">
                            {user.banned ? (
                              <ConfirmActionForm
                                userId={user.id}
                                label="Aktifkan"
                                title="Aktifkan User"
                                description={`${user.displayName ?? user.name} akan bisa login kembali.`}
                                action={unbanManagedUserAction}
                                icon={<UserCheck className="h-3.5 w-3.5" />}
                              />
                            ) : (
                              <ConfirmActionForm
                                userId={user.id}
                                label="Nonaktifkan"
                                title="Nonaktifkan User"
                                description={`${user.displayName ?? user.name} akan dikeluarkan dari semua sesi aktif.`}
                                action={banManagedUserAction}
                                icon={<Ban className="h-3.5 w-3.5" />}
                                tone="danger"
                                disabled={isSelf}
                              />
                            )}
                            <ConfirmActionForm
                              userId={user.id}
                              label="Cabut Sesi"
                              title="Cabut Semua Sesi"
                              description={`Semua sesi aktif milik ${user.displayName ?? user.name} akan dicabut.`}
                              action={revokeManagedUserSessionsAction}
                              icon={<KeyRound className="h-3.5 w-3.5" />}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
