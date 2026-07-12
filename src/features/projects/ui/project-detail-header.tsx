"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Tab,
  Tabs,
} from "@heroui/react";
import {
  BarChart2,
  Check,
  ChevronDown,
  FileText,
  ListTodo,
  Pencil,
  Shapes,
  X,
} from "lucide-react";
import type { Selection } from "@react-types/shared";

import type { ProjectDetail } from "../application/contracts";
import { updateProjectAction } from "../server/project-actions";
import { projectActionInitialState } from "../server/action-state";
import {
  projectStatusClasses,
  projectStatusLabels,
} from "./project-ui-utils";
import { projectStatuses, type ProjectStatus } from "../domain/project-policy";
import {
  getVisibleProjectTabs,
  type ProjectDetailTabKey,
} from "./project-tabs";
import { useActionToast } from "@/src/shared/ui/use-action-toast";

type ProjectDetailHeaderProps = {
  project: ProjectDetail;
  activeTab: ProjectDetailTabKey;
};

const tabConfig: Array<{
  key: ProjectDetailTabKey;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { key: "detail", label: "Detail", icon: FileText },
  {
    key: "tasks",
    label: "Daftar Tugas",
    icon: ListTodo,
  },
  {
    key: "categories",
    label: "Kategori",
    icon: Shapes,
  },
  {
    key: "report",
    label: "Laporan",
    icon: BarChart2,
  },
];

function buildUpdateFormData(project: ProjectDetail, updates: Partial<ProjectDetail>) {
  const formData = new FormData();
  formData.set("projectId", project.id);
  formData.set("version", String(project.version));
  formData.set("title", updates.title ?? project.title);
  formData.set("description", updates.description ?? project.description ?? "");
  formData.set("status", updates.status ?? project.status);
  formData.set(
    "startDate",
    project.startDate ? project.startDate.toISOString().slice(0, 10) : "",
  );
  formData.set(
    "endDate",
    project.endDate ? project.endDate.toISOString().slice(0, 10) : "",
  );
  return formData;
}

export function ProjectDetailHeader({
  project,
  activeTab,
}: ProjectDetailHeaderProps) {
  const [state, dispatch, isPending] = useActionState(
    updateProjectAction,
    projectActionInitialState,
  );
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(project.title);
  const canEdit = project.capabilities.canEditProject;
  const status = project.status as ProjectStatus;
  useActionToast(state);
  const availableTabs = useMemo(
    () =>
      getVisibleProjectTabs(project.capabilities).map((tab) => ({
        ...tab,
        icon:
          tabConfig.find((item) => item.key === tab.key)?.icon ??
          FileText,
      })),
    [project],
  );

  const saveTitle = () => {
    if (!canEdit || !title.trim() || title === project.title) {
      setIsEditingTitle(false);
      setTitle(project.title);
      return;
    }

    dispatch(buildUpdateFormData(project, { title }));
    setIsEditingTitle(false);
  };

  const changeStatus = (keys: Selection) => {
    const nextStatus = Array.from(keys)[0] as ProjectStatus | undefined;
    if (!nextStatus || nextStatus === project.status || !canEdit) {
      return;
    }
    dispatch(buildUpdateFormData(project, { status: nextStatus } as Partial<ProjectDetail>));
  };

  return (
    <header className="space-y-4">
      <Link href="/projects" className="text-sm font-semibold text-[var(--color-primary)]">
        Kembali ke project
      </Link>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          {isEditingTitle ? (
            <div className="flex max-w-xl items-center gap-2">
              <Input
                value={title}
                onValueChange={setTitle}
                autoFocus
                variant="underlined"
                classNames={{ input: "text-3xl font-extrabold" }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveTitle();
                  if (event.key === "Escape") {
                    setIsEditingTitle(false);
                    setTitle(project.title);
                  }
                }}
              />
              <Button
                isIconOnly
                variant="light"
                aria-label="Simpan judul project"
                onPress={saveTitle}
              >
                <Check className="text-[var(--color-accent)]" />
              </Button>
              <Button
                isIconOnly
                variant="light"
                aria-label="Batal edit judul project"
                onPress={() => {
                  setIsEditingTitle(false);
                  setTitle(project.title);
                }}
              >
                <X className="text-[var(--color-secondary)]" />
              </Button>
            </div>
          ) : (
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="truncate text-3xl font-extrabold text-[var(--color-text-main)]">
                {project.title}
              </h1>
              {canEdit ? (
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  aria-label="Edit judul project"
                  onPress={() => setIsEditingTitle(true)}
                >
                  <Pencil size={17} />
                </Button>
              ) : null}
            </div>
          )}
          <p className="mt-1 text-sm text-gray-500">{project.departmentName}</p>
          {state.message ? (
            <p className={state.ok ? "mt-2 text-sm text-[var(--color-accent)]" : "mt-2 text-sm text-[var(--color-secondary)]"}>
              {state.message}
            </p>
          ) : null}
        </div>

        {canEdit ? (
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="bordered"
                isLoading={isPending}
                endContent={<ChevronDown size={16} />}
                className={projectStatusClasses[status]}
              >
                {projectStatusLabels[status]}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Ubah status project"
              selectionMode="single"
              selectedKeys={[project.status]}
              onSelectionChange={changeStatus}
            >
              {projectStatuses.map((option) => (
                <DropdownItem key={option}>
                  {projectStatusLabels[option]}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        ) : (
          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1 text-sm font-semibold ${projectStatusClasses[status]}`}
          >
            {projectStatusLabels[status]}
          </span>
        )}
      </div>

      <div className="border-b border-gray-200">
        <Tabs
          aria-label="Navigasi Project"
          selectedKey={activeTab}
          classNames={{
            tabList: "gap-4 bg-transparent p-0",
            cursor: "h-0.5 rounded-t-lg bg-[var(--color-primary)]",
            tab: "h-auto px-1 py-3",
            tabContent:
              "font-semibold text-gray-500 group-data-[selected=true]:text-[var(--color-primary)]",
          }}
        >
          {availableTabs.map((tab) => (
            <Tab
              key={tab.key}
              href={`/projects/${project.id}?tab=${tab.key}`}
              title={
                <div className="flex items-center gap-2">
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                </div>
              }
            />
          ))}
        </Tabs>
      </div>
    </header>
  );
}
