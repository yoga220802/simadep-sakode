"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
    startDate?: string;
    endDate?: string;
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
    <div className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl bg-[var(--simadep-primary-soft)] p-1">
      {statusTabs.map((tab) => {
        const isActive = selected === tab.key;
        return (
          <Link
            key={tab.key}
            href={mergeSearchParams(pathname, searchParams, {
              status: tab.key === "all" ? undefined : tab.key,
            })}
            className={`inline-flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-bold transition ${
              isActive
                ? "bg-[var(--color-primary)] text-[var(--simadep-foreground)] shadow-sm"
                : "text-[var(--simadep-muted)] hover:bg-white/70 hover:text-[var(--color-text-main)]"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`min-w-6 rounded-full px-2 py-0.5 text-center text-xs ${
                isActive
                  ? "bg-[var(--color-secondary)] text-white"
                  : "bg-white text-[var(--simadep-muted)]"
              }`}
            >
              {page.summary[tab.key]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function ProjectDateRangeFilter({
  currentFilters,
}: {
  currentFilters: ProjectListViewProps["currentFilters"];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [startDate, setStartDate] = useState(currentFilters.startDate ?? "");
  const [endDate, setEndDate] = useState(currentFilters.endDate ?? "");

  useEffect(() => {
    setStartDate(currentFilters.startDate ?? "");
    setEndDate(currentFilters.endDate ?? "");
  }, [currentFilters.endDate, currentFilters.startDate]);

  function applyDateRange(nextStartDate = startDate, nextEndDate = endDate) {
    router.replace(
      mergeSearchParams(pathname, searchParams, {
        startDate: nextStartDate,
        endDate: nextEndDate,
      }),
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        size="sm"
        label="Mulai"
        className="w-40"
        value={startDate}
        onValueChange={(value) => {
          setStartDate(value);
          applyDateRange(value, endDate);
        }}
        onBlur={() => applyDateRange()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            applyDateRange();
          }
        }}
      />
      <Input
        type="date"
        size="sm"
        label="Akhir"
        className="w-40"
        value={endDate}
        onValueChange={(value) => {
          setEndDate(value);
          applyDateRange(startDate, value);
        }}
        onBlur={() => applyDateRange()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            applyDateRange();
          }
        }}
      />
    </div>
  );
}

function ProjectSearchFilter({
  departments,
  currentFilters,
}: {
  departments: DepartmentOption[];
  currentFilters: ProjectListViewProps["currentFilters"];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(currentFilters.q ?? "");

  useEffect(() => {
    setQuery(currentFilters.q ?? "");
  }, [currentFilters.q]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (query === (currentFilters.q ?? "")) {
        return;
      }

      router.replace(
        mergeSearchParams(pathname, searchParams, {
          q: query,
        }),
      );
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [currentFilters.q, pathname, query, router, searchParams]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={query}
        onValueChange={setQuery}
        placeholder="Cari project"
        size="sm"
        startContent={<Search size={16} />}
        className="w-56"
      />
      <select
        defaultValue={currentFilters.departmentId ?? ""}
        className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
        onChange={(event) =>
          router.replace(
            mergeSearchParams(pathname, searchParams, {
              departmentId: event.currentTarget.value,
            }),
          )
        }
      >
        <option value="">Semua departemen</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>
    </div>
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
          <ProjectDateRangeFilter currentFilters={currentFilters} />
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
