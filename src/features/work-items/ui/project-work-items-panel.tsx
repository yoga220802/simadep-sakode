import {
  createCategoryAction,
  createMilestoneAction,
  createTaskAction,
  deleteCategoryAction,
  deleteMilestoneAction,
  updateCategoryAction,
  updateMilestoneAction,
} from "../server/work-item-actions";
import type { ProjectWorkItems } from "../application/contracts";
import type { TaskCollaboration } from "@/src/features/collaboration";
import { WorkItemActionForm } from "./work-item-action-form";
import { TaskCard, TaskFormFields } from "./work-item-task-card";

type ProjectWorkItemsPanelProps = {
  projectId: string;
  workItems: ProjectWorkItems;
  collaborationByTaskId?: Record<string, TaskCollaboration>;
};

export function ProjectWorkItemsPanel({
  projectId,
  workItems,
  collaborationByTaskId,
}: ProjectWorkItemsPanelProps) {
  return (
    <section className="space-y-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-bold">Milestone, Tugas, dan Kategori</h2>
        <p className="text-sm text-gray-500">
          {workItems.milestones.length} milestone · {workItems.categories.length} kategori
        </p>
      </div>

      {workItems.canManage ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <WorkItemActionForm action={createMilestoneAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input
              name="title"
              placeholder="Milestone baru"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <button className="rounded bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white">
              Tambah Milestone
            </button>
          </WorkItemActionForm>

          <WorkItemActionForm action={createCategoryAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input
              name="name"
              placeholder="Kategori baru"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
              required
            />
            <input
              name="description"
              placeholder="Deskripsi kategori"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
            />
            <button className="rounded bg-[var(--color-secondary)] px-3 py-2 text-sm font-semibold text-white">
              Tambah Kategori
            </button>
          </WorkItemActionForm>
        </div>
      ) : null}

      {workItems.categories.length ? (
        <div className="flex flex-wrap gap-2">
          {workItems.categories.map((category) => (
            <div key={category.id} className="rounded border border-gray-200 p-2">
              <WorkItemActionForm action={updateCategoryAction}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="categoryId" value={category.id} />
                <input
                  name="name"
                  defaultValue={category.name}
                  className="w-36 rounded border border-gray-200 px-2 py-1 text-xs"
                />
                <input
                  name="description"
                  defaultValue={category.description ?? ""}
                  className="w-48 rounded border border-gray-200 px-2 py-1 text-xs"
                />
                <button className="text-xs font-semibold text-gray-700">Simpan</button>
              </WorkItemActionForm>
              {workItems.canManage ? (
                <WorkItemActionForm action={deleteCategoryAction}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="categoryId" value={category.id} />
                  <button className="text-xs text-[var(--color-secondary)]">Hapus</button>
                </WorkItemActionForm>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-4">
        {workItems.milestones.map((milestone) => (
          <div key={milestone.id} className="space-y-3 rounded-lg bg-gray-50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <WorkItemActionForm action={updateMilestoneAction} className="flex-1">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="milestoneId" value={milestone.id} />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    name="title"
                    defaultValue={milestone.title}
                    className="flex-1 rounded border border-gray-200 px-3 py-2 text-sm font-semibold"
                  />
                  <input
                    type="number"
                    min="0"
                    name="displayOrder"
                    defaultValue={milestone.displayOrder}
                    className="w-24 rounded border border-gray-200 px-3 py-2 text-sm"
                  />
                  <button className="rounded bg-gray-900 px-3 py-2 text-sm font-semibold text-white">
                    Simpan
                  </button>
                </div>
              </WorkItemActionForm>
              {workItems.canManage ? (
                <WorkItemActionForm action={deleteMilestoneAction}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="milestoneId" value={milestone.id} />
                  <button className="rounded border border-[var(--color-secondary)]/30 px-3 py-2 text-sm font-semibold text-[var(--color-secondary)]">
                    Hapus Milestone
                  </button>
                </WorkItemActionForm>
              ) : null}
            </div>

            {workItems.canManage ? (
              <details className="rounded border border-dashed border-gray-200 bg-white p-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  Tambah Tugas
                </summary>
                <WorkItemActionForm action={createTaskAction} className="mt-3">
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="milestoneId" value={milestone.id} />
                  <TaskFormFields categories={workItems.categories} />
                  <button className="rounded bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white">
                    Buat Tugas
                  </button>
                </WorkItemActionForm>
              </details>
            ) : null}

            {milestone.tasks.length ? (
              <div className="space-y-3">
                {milestone.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    projectId={projectId}
                    categories={workItems.categories}
                    projectMembers={workItems.projectMembers}
                    canManage={workItems.canManage}
                    collaborationByTaskId={collaborationByTaskId}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
                Belum ada tugas.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
