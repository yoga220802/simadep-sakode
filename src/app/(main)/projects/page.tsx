import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@/src/infrastructure/auth";
import {
  getProjectActor,
  listProjectDepartmentsForActor,
  listProjectsForActor,
} from "@/src/features/projects/application/project-use-cases";
import { ProjectCreateForm } from "@/src/features/projects/ui/project-forms";
import { canCreateProject } from "@/src/features/projects/domain/project-policy";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
    q?: string;
    status?: string;
    departmentId?: string;
    startYear?: string;
    endYear?: string;
  }>;
};

export default async function ProjectsPage({ searchParams }: PageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const actor = await getProjectActor(session.user.id);
  const departments = await listProjectDepartmentsForActor(actor);
  const page = await listProjectsForActor(actor, {
    page: params?.page,
    search: params?.q,
    status:
      params?.status === "tender" ||
      params?.status === "active" ||
      params?.status === "completed" ||
      params?.status === "cancelled"
        ? params.status
        : undefined,
    departmentId: params?.departmentId || undefined,
    startYear: params?.startYear || undefined,
    endYear: params?.endYear || undefined,
  });
  const canCreate = departments.some((department) =>
    canCreateProject(actor, department.id),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">
            Project
          </h1>
          <p className="text-sm text-gray-500">
            Browse project berdasarkan scope aktor, departemen, status, tahun, dan pencarian.
          </p>
        </div>

        <form className="flex flex-wrap gap-2" action="/projects">
          <input
            name="q"
            defaultValue={params?.q ?? ""}
            placeholder="Cari project"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <select
            name="departmentId"
            defaultValue={params?.departmentId ?? ""}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">Semua departemen</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={params?.status ?? ""}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">Semua status</option>
            <option value="tender">tender</option>
            <option value="active">active</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <input
            name="startYear"
            defaultValue={params?.startYear ?? ""}
            placeholder="Mulai"
            inputMode="numeric"
            className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            name="endYear"
            defaultValue={params?.endYear ?? ""}
            placeholder="Akhir"
            inputMode="numeric"
            className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
            Filter
          </button>
        </form>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {Object.entries(page.summary).map(([status, count]) => (
          <div key={status} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs uppercase text-gray-500">{status}</p>
            <p className="text-2xl font-bold">{count}</p>
          </div>
        ))}
      </div>

      {canCreate && <ProjectCreateForm departments={departments} />}

      {page.items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          Tidak ada project sesuai filter.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {page.items.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[var(--color-primary)] hover:shadow-md">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-main)]">
                    {project.title}
                  </h2>
                  <p className="text-xs text-gray-500">{project.departmentName}</p>
                </div>
                <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {project.status}
                </span>
              </div>
              <p className="line-clamp-3 min-h-12 text-sm text-gray-600">
                {project.description ?? "Belum ada deskripsi."}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-500">
                <span>{project.memberCount} member</span>
                <span>{project.totalTasks} tugas</span>
                <span>v{project.version}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          Halaman {page.page} dari {page.totalPages}
        </span>
        <div className="flex gap-2">
          {page.page > 1 && (
            <Link
              href={`/projects?page=${page.page - 1}`}
              className="rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50">
              Sebelumnya
            </Link>
          )}
          {page.page < page.totalPages && (
            <Link
              href={`/projects?page=${page.page + 1}`}
              className="rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50">
              Berikutnya
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
