import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@/src/infrastructure/auth";
import { getProjectActor } from "@/src/features/projects";
import {
  listMyTasks,
  taskStatuses,
  type MyTaskListInput,
} from "@/src/features/work-items";
import { changeTaskStatusAction } from "@/src/features/work-items/server/work-item-actions";
import { WorkItemActionForm } from "@/src/features/work-items/ui/work-item-action-form";

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
    status: getParam(params, "status") as never,
  };
  const actor = await getProjectActor(session.user.id);
  const tasks = await listMyTasks(actor, filters);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-main)]">
            Tugas Saya
          </h1>
          <p className="text-sm text-gray-500">
            Daftar tugas yang ditugaskan langsung ke akun Anda.
          </p>
        </div>
        <form className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row">
          <input
            name="q"
            defaultValue={filters.search}
            placeholder="Cari tugas atau project"
            className="rounded border border-gray-200 px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={filters.status ?? ""}
            className="rounded border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Semua status</option>
            {taskStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <button className="rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
            Filter
          </button>
        </form>
      </div>

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_120px_120px_180px] gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold uppercase text-gray-500">
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
                className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_120px_120px_180px]"
              >
                <Link
                  href={`/projects/${task.projectId}`}
                  className="font-semibold text-gray-900 hover:text-[var(--color-primary)]"
                >
                  {task.name}
                </Link>
                <span className="text-sm text-gray-600">{task.projectTitle}</span>
                <span className="text-sm text-gray-600">{formatDate(task.dueDate)}</span>
                <span className="text-sm text-gray-600">
                  {durationLabel(task.finishedDurationMinutes)}
                </span>
                <WorkItemActionForm action={changeTaskStatusAction}>
                  <input type="hidden" name="projectId" value={task.projectId} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="version" value={task.version} />
                  <select
                    name="status"
                    defaultValue={task.status}
                    className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                  >
                    {taskStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button className="rounded bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-white">
                    Simpan
                  </button>
                </WorkItemActionForm>
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
