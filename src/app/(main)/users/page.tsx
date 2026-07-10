import { redirect } from "next/navigation";

import {
  listManagedUsers,
  setGlobalRoleAction,
} from "@/src/features/identity/users";
import { UserCreateForm } from "@/src/features/identity/users/ui/user-create-form";
import { getServerSession } from "@/src/infrastructure/auth";

export const dynamic = "force-dynamic";

function roleLabel(role: string) {
  if (role === "super_admin") {
    return "Super Admin";
  }

  if (role === "admin") {
    return "Admin";
  }

  return "User";
}

export default async function UsersPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const users = await listManagedUsers({
    id: session.user.id,
    role: session.user.role,
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-main)]">
          Pegawai
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Tambah user dan kelola role global pengguna SIMADEP.
        </p>
      </div>

      <UserCreateForm />

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Jabatan</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => {
              const isSelf = user.id === session.user.id;

              return (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {user.displayName ?? user.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.position ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {roleLabel(user.role)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.banned ? "Nonaktif" : "Aktif"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={setGlobalRoleAction} className="flex gap-2">
                      <input type="hidden" name="targetUserId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        disabled={isSelf}
                        className="rounded-md border border-gray-200 px-2 py-1 text-sm disabled:bg-gray-100"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                      <button
                        type="submit"
                        disabled={isSelf}
                        className="rounded-md bg-[var(--color-primary)] px-3 py-1 text-sm font-semibold text-[var(--simadep-foreground)] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                      >
                        Simpan
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
