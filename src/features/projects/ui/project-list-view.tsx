"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
} from "@heroui/react";
import {
  Archive,
  Calendar,
  Edit,
  MoreVertical,
  Plus,
  Search,
  Users,
} from "lucide-react";

import type {
  ProjectListItem,
  ProjectPage,
} from "../application/contracts";
import { ProjectFormModal } from "./project-form-modal";
import { ProjectArchiveConfirmationModal } from "./project-confirmation-modal";
import {
  formatProjectDate,
  projectStatusClasses,
  projectStatusLabels,
  type ProjectUiRecord,
} from "./project-ui-utils";

type DepartmentOption = {
  id: string;
  name: string;
  code: string;
};

type ProjectListViewProps = {
  page: ProjectPage;
  departments: DepartmentOption[];
  canCreate: boolean;
  currentFilters: {
    q?: string;
    status?: string;
    departmentId?: string;
    startYear?: string;
    endYear?: string;
  };
};

const statusTabs = [
  { key: "all", label: "Semua" },
  { key: "tender", label: "Pengajuan" },
  { key: "active", label: "Aktif" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
] as const;

function mergeSearchParams(
  pathname: string,
  searchParams: URLSearchParams,
  updates: Record<string, string | undefined>,
) {
  const next = new URLSearchParams(searchParams);
  for (const [key, value] of Object.entries(updates)) {
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  next.delete("page");
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function pageHref(
  pathname: string,
  searchParams: URLSearchParams,
  page: number,
) {
  const next = new URLSearchParams(searchParams);
  next.set("page", String(page));
  return `${pathname}?${next.toString()}`;
}

function ProjectFilterTabs({
  page,
  activeStatus,
}: {
  page: ProjectPage;
  activeStatus?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = activeStatus ?? "all";

  return (
    <div className="flex flex-wrap gap-2">
      {statusTabs.map((tab) => {
        const isActive = selected === tab.key;
        return (
          <Link
            key={tab.key}
            href={mergeSearchParams(pathname, searchParams, {
              status: tab.key === "all" ? undefined : tab.key,
            })}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-text-main)]"
                : "border-gray-200 bg-white text-gray-600 hover:border-[var(--color-primary)]"
            }`}
          >
            {tab.label} ({page.summary[tab.key]})
          </Link>
        );
      })}
    </div>
  );
}

function ProjectYearFilter({
  currentFilters,
}: {
  currentFilters: ProjectListViewProps["currentFilters"];
}) {
  return (
    <form action="/projects" className="flex flex-wrap items-center gap-2">
      {currentFilters.q ? <input type="hidden" name="q" value={currentFilters.q} /> : null}
      {currentFilters.status ? (
        <input type="hidden" name="status" value={currentFilters.status} />
      ) : null}
      {currentFilters.departmentId ? (
        <input
          type="hidden"
          name="departmentId"
          value={currentFilters.departmentId}
        />
      ) : null}
      <Input
        name="startYear"
        type="number"
        min={1970}
        max={9999}
        size="sm"
        label="Mulai"
        className="w-28"
        defaultValue={currentFilters.startYear ?? ""}
      />
      <Input
        name="endYear"
        type="number"
        min={1970}
        max={9999}
        size="sm"
        label="Akhir"
        className="w-28"
        defaultValue={currentFilters.endYear ?? ""}
      />
      <Button type="submit" size="sm" variant="bordered">
        Terapkan Tahun
      </Button>
    </form>
  );
}

function ProjectSearchFilter({
  departments,
  currentFilters,
}: {
  departments: DepartmentOption[];
  currentFilters: ProjectListViewProps["currentFilters"];
}) {
  return (
    <form action="/projects" className="flex flex-wrap items-center gap-2">
      {currentFilters.status ? (
        <input type="hidden" name="status" value={currentFilters.status} />
      ) : null}
      {currentFilters.startYear ? (
        <input type="hidden" name="startYear" value={currentFilters.startYear} />
      ) : null}
      {currentFilters.endYear ? (
        <input type="hidden" name="endYear" value={currentFilters.endYear} />
      ) : null}
      <Input
        name="q"
        defaultValue={currentFilters.q ?? ""}
        placeholder="Cari project"
        size="sm"
        startContent={<Search size={16} />}
        className="w-56"
      />
      <select
        name="departmentId"
        defaultValue={currentFilters.departmentId ?? ""}
        className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm"
      >
        <option value="">Semua departemen</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="bordered">
        Filter
      </Button>
    </form>
  );
}

function ProjectCard({
  project,
  onEdit,
  onArchive,
}: {
  project: ProjectListItem;
  onEdit: (project: ProjectUiRecord) => void;
  onArchive: (project: ProjectListItem) => void;
}) {
  const status = project.status as keyof typeof projectStatusLabels;
  const canManage =
    project.capabilities.canEditProject || project.capabilities.canArchiveProject;

  return (
    <article className="group relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            {project.departmentName ?? "Tanpa departemen"}
          </p>
          <h2 className="mt-1 line-clamp-2 text-lg font-extrabold text-[var(--color-text-main)]">
            {project.title}
          </h2>
        </Link>
        {canManage ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                aria-label={`Aksi project ${project.title}`}
              >
                <MoreVertical size={18} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Aksi project">
              {project.capabilities.canEditProject ? (
                <DropdownItem
                  key="edit"
                  startContent={<Edit size={16} />}
                  onPress={() => onEdit(project)}
                >
                  Edit
                </DropdownItem>
              ) : null}
              {project.capabilities.canArchiveProject ? (
                <DropdownItem
                  key="archive"
                  color="danger"
                  startContent={<Archive size={16} />}
                  onPress={() => onArchive(project)}
                >
                  Arsipkan
                </DropdownItem>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        ) : null}
      </div>

      <Link href={`/projects/${project.id}`} className="block">
        <p className="line-clamp-3 min-h-16 text-sm leading-6 text-gray-600">
          {project.description ?? "Belum ada deskripsi untuk project ini."}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${projectStatusClasses[status]}`}
          >
            {projectStatusLabels[status]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            <Users size={13} />
            {project.memberCount} anggota
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            {project.totalTasks} tugas
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
          <Calendar size={14} />
          <span>{formatProjectDate(project.startDate)}</span>
          <span>-</span>
          <span>{formatProjectDate(project.endDate)}</span>
        </div>
      </Link>
    </article>
  );
}

export function ProjectListView({
  page,
  departments,
  canCreate,
  currentFilters,
}: ProjectListViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectUiRecord | null>(null);
  const [projectToArchive, setProjectToArchive] = useState<ProjectListItem | null>(
    null,
  );

  const activeStatus = currentFilters.status ?? "all";
  const pageRange = useMemo(
    () => ({
      previous: page.page > 1 ? page.page - 1 : null,
      next: page.page < page.totalPages ? page.page + 1 : null,
    }),
    [page.page, page.totalPages],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-main)]">
              Project
            </h1>
            <p className="text-sm text-gray-500">
              Kelola project sesuai scope departemen dan keanggotaan Anda.
            </p>
          </div>
          <ProjectFilterTabs page={page} activeStatus={activeStatus} />
          <ProjectYearFilter currentFilters={currentFilters} />
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <ProjectSearchFilter
            departments={departments}
            currentFilters={currentFilters}
          />
          {canCreate ? (
            <Button
              color="primary"
              className="bg-[var(--color-primary)] font-bold text-[var(--simadep-foreground)]"
              startContent={<Plus size={18} />}
              onPress={() => {
                setProjectToEdit(null);
                setIsFormOpen(true);
              }}
            >
              Buat Project
            </Button>
          ) : null}
        </div>
      </div>

      {page.items.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {page.items.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={(selected) => {
                setProjectToEdit(selected);
                setIsFormOpen(true);
              }}
              onArchive={setProjectToArchive}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          <h3 className="text-xl font-bold text-[var(--color-text-main)]">
            Tidak Ada Project
          </h3>
          <p className="mt-1 text-sm">
            Tidak ada project yang sesuai dengan filter yang dipilih.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Halaman {page.page} dari {page.totalPages} ({page.totalItems} project)
        </span>
        <div className="flex gap-2">
          {pageRange.previous ? (
            <Button
              as={Link}
              href={pageHref(pathname, searchParams, pageRange.previous)}
              variant="bordered"
              size="sm"
            >
              Sebelumnya
            </Button>
          ) : null}
          {pageRange.next ? (
            <Button
              as={Link}
              href={pageHref(pathname, searchParams, pageRange.next)}
              variant="bordered"
              size="sm"
            >
              Berikutnya
            </Button>
          ) : null}
        </div>
      </div>

      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        departments={departments}
        project={projectToEdit}
      />
      <ProjectArchiveConfirmationModal
        isOpen={Boolean(projectToArchive)}
        onClose={() => setProjectToArchive(null)}
        project={projectToArchive}
      />
    </div>
  );
}
