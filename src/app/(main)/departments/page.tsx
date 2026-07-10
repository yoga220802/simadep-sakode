import { redirect } from "next/navigation";

import { getServerSession } from "@/src/infrastructure/auth";
import {
  DepartmentEditForm,
  DepartmentMembersPanel,
  CreateDepartmentForm,
} from "@/src/features/departments/ui/department-forms";
import {
  getDepartmentActor,
  listDepartmentAssignableUsers,
  listDepartmentMembersForActor,
  listDepartmentsForActor,
} from "@/src/features/departments/application/department-use-cases";
import type { DepartmentMemberItem } from "@/src/features/departments/application/contracts";
import { isGlobalDepartmentAdmin } from "@/src/features/departments/domain/department-policy";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
  }>;
};

export default async function DepartmentsPage({ searchParams }: PageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const actor = await getDepartmentActor(session.user.id);
  const departments = await listDepartmentsForActor(actor, {
    query: params?.q,
    status: params?.status === "archived" ? "archived" : "active",
  });
  const users = await listDepartmentAssignableUsers(actor);
  const memberEntries: Array<[string, DepartmentMemberItem[]]> =
    await Promise.all(
      departments.map(async (department) => [
        department.id,
        await listDepartmentMembersForActor(actor, department.id),
      ]),
    );
  const membersByDepartment = new Map(memberEntries);
  const canCreateDepartment = isGlobalDepartmentAdmin(actor.globalRole);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">
            Departemen
          </h1>
          <p className="text-sm text-gray-500">
            Kelola struktur departemen, role anggota, dan akses lingkup kerja.
          </p>
        </div>

        <form className="flex flex-wrap gap-2" action="/departments">
          <input
            name="q"
            defaultValue={params?.q ?? ""}
            placeholder="Cari departemen"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={params?.status ?? "active"}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="active">Aktif</option>
            <option value="archived">Arsip</option>
          </select>
          <button
            type="submit"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
            Filter
          </button>
        </form>
      </div>

      {canCreateDepartment && (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold">Buat Departemen</h2>
          <CreateDepartmentForm />
        </section>
      )}

      <section className="space-y-4">
        {departments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            Tidak ada departemen sesuai filter.
          </div>
        ) : (
          departments.map((department) => (
            <article
              key={department.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-[var(--color-text-main)]">
                      {department.name}
                    </h2>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                      {department.code}
                    </span>
                    <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      {department.actorRole}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                      {department.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {department.description ?? "Belum ada deskripsi."}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {department.memberCount} anggota aktif, {department.headCount} head aktif
                  </p>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <DepartmentEditForm department={department} />
                <DepartmentMembersPanel
                  department={department}
                  members={membersByDepartment.get(department.id) ?? []}
                  users={users}
                />
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
