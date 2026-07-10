import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getServerSession } from "@/src/infrastructure/auth";
import {
  getProjectActor,
  getProjectDetailForActor,
  listAssignableProjectUsers,
} from "@/src/features/projects/application/project-use-cases";
import {
  ProjectEditForm,
  ProjectMembersPanel,
} from "@/src/features/projects/ui/project-forms";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const actor = await getProjectActor(session.user.id);
  const users = await listAssignableProjectUsers();

  let project;
  try {
    project = await getProjectDetailForActor(actor, id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href="/projects" className="text-sm text-[var(--color-primary)]">
            Kembali ke project
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-text-main)]">
            {project.title}
          </h1>
          <p className="text-sm text-gray-500">{project.departmentName}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-[var(--color-primary)]">
            {project.status}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            {project.actorRole}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            v{project.version}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Total Tugas</p>
          <p className="text-3xl font-bold">{project.totalTasks}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Tugas Selesai</p>
          <p className="text-3xl font-bold">{project.completedTasks}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Anggota</p>
          <p className="text-3xl font-bold">{project.memberCount}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-base font-bold">Metadata Project</h2>
          <ProjectEditForm project={project} />
        </section>
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-base font-bold">Anggota Project</h2>
          <ProjectMembersPanel
            projectId={project.id}
            members={project.members}
            users={users}
          />
        </section>
      </div>
    </div>
  );
}
