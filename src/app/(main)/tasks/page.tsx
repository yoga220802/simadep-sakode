import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { getServerSession } from "@/src/infrastructure/auth";
import { getProjectActor } from "@/src/features/projects";
import {
  listMyTasks,
  taskStatuses,
  type MyTaskListInput,
} from "@/src/features/work-items";
import { MyTaskStatusSelect } from "@/src/features/work-items/ui/my-task-status-select";
import { MyTasksFilter } from "@/src/features/work-items/ui/my-tasks-filter";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(value);
}

function durationLabel(minutes: number | null) {
  if (minutes == null) {
    return "-";
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours ? `${hours}j ` : ""}${rest}m`;
}

export default async function MyTasksPage({ searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const filters: MyTaskListInput = {
    search: getParam(params, "q") || undefined,
    status: (getParam(params, "status") || undefined) as never,
  };
  const actor = await getProjectActor(session.user.id);
  const tasks = await listMyTasks(actor, filters);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">
            Tugas Saya
          </h1>
          <p className="text-sm text-gray-500">
            Daftar tugas yang ditugaskan langsung ke akun Anda.
          </p>
        </div>
        <MyTasksFilter
          filters={{ q: filters.search, status: filters.status as string | undefined }}
          statuses={[...taskStatuses]}
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_120px_120px_220px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold uppercase text-gray-500 md:grid">
          <span>Tugas</span>
          <span>Project</span>
          <span>Tenggat</span>
          <span>Durasi</span>
          <span>Status</span>
        </div>
        {tasks.length ? (
          <div className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_120px_120px_220px]"
              >
                <Link
                  href={`/projects/${task.projectId}?tab=tasks`}
                  className="font-semibold text-gray-900 hover:text-[var(--color-primary)]"
                >
                  {task.name}
                </Link>
                <Link
                  href={`/projects/${task.projectId}?tab=tasks`}
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-[var(--color-primary)]"
                >
                  {task.projectTitle}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <span className="text-sm text-gray-600">{formatDate(task.dueDate)}</span>
                <span className="text-sm text-gray-600">
                  {durationLabel(task.finishedDurationMinutes)}
                </span>
                <MyTaskStatusSelect task={task} statuses={[...taskStatuses]} />
              </div>
            ))}
          </div>
        ) : (
          <p className="p-6 text-sm text-gray-500">Belum ada tugas.</p>
        )}
      </section>
    </div>
  );
}
