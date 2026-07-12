"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarGroup,
  Button,
  Input,
  Textarea,
  Tooltip,
} from "@heroui/react";
import { Calendar, Plus, Users } from "lucide-react";

import type { ProjectDetail } from "../application/contracts";
import { updateProjectAction } from "../server/project-actions";
import { projectActionInitialState } from "../server/action-state";
import { ProjectMembersModal } from "./project-members-modal";
import { dateInputValue, formatProjectDate, initials } from "./project-ui-utils";
import { useActionToast } from "@/src/shared/ui/use-action-toast";

type DepartmentOption = {
  id: string;
  name: string;
  code: string;
};

type ProjectDetailTabProps = {
  project: ProjectDetail;
  departments: DepartmentOption[];
};

const projectUpdateFieldNames = [
  "title",
  "description",
  "status",
  "startDate",
  "endDate",
] as const;

type ProjectUpdateFieldName = (typeof projectUpdateFieldNames)[number];

function projectUpdateValue(project: ProjectDetail, field: ProjectUpdateFieldName) {
  const values: Record<ProjectUpdateFieldName, string> = {
    title: project.title,
    description: project.description ?? "",
    status: project.status,
    startDate: dateInputValue(project.startDate),
    endDate: dateInputValue(project.endDate),
  };

  return values[field];
}

function ProjectUpdateHiddenFields({
  project,
  exclude,
}: {
  project: ProjectDetail;
  exclude: ProjectUpdateFieldName[];
}) {
  const excluded = new Set<ProjectUpdateFieldName>(exclude);

  return (
    <>
      <input type="hidden" name="projectId" value={project.id} />
      <input type="hidden" name="version" value={project.version} />
      {projectUpdateFieldNames.map((field) =>
        excluded.has(field) ? null : (
          <input
            key={field}
            type="hidden"
            name={field}
            value={projectUpdateValue(project, field)}
          />
        ),
      )}
    </>
  );
}

export function ProjectDetailTab({
  project,
}: ProjectDetailTabProps) {
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [state, formAction] = useActionState(
    updateProjectAction,
    projectActionInitialState,
  );
  const handledStateRef = useRef(state);
  const router = useRouter();
  const canEdit = project.capabilities.canEditProject;
  const canManageMembers = project.capabilities.canManageMembers;
  useActionToast(state);

  useEffect(() => {
    if (!state.ok || !state.message || handledStateRef.current === state) {
      return;
    }

    handledStateRef.current = state;
    router.refresh();
  }, [router, state]);

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[var(--color-text-main)]">
            Deskripsi Project
          </h2>
        </div>
        {canEdit ? (
          <form action={formAction} className="max-w-4xl">
            <ProjectUpdateHiddenFields project={project} exclude={["description"]} />
            <Textarea
              aria-label="Deskripsi project"
              name="description"
              minRows={5}
              defaultValue={project.description ?? ""}
              placeholder="Tidak ada deskripsi untuk project ini."
              onBlur={(event) => event.currentTarget.form?.requestSubmit()}
            />
          </form>
        ) : (
          <p className="max-w-4xl whitespace-pre-wrap text-gray-600">
            {project.description || (
              <span className="italic text-gray-400">
                Tidak ada deskripsi untuk project ini.
              </span>
            )}
          </p>
        )}
        {state.message ? (
          <p
            className={
              state.ok ? "mt-2 text-sm text-[var(--color-accent)]" : "mt-2 text-sm text-[var(--color-secondary)]"
            }
          >
            {state.message}
          </p>
        ) : null}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[var(--color-text-main)]">
            Jadwal Project
          </h2>
        </div>
        <div className="flex flex-col gap-5 text-gray-700 sm:flex-row sm:gap-10">
          <div className="flex items-center gap-3">
            <Calendar className="text-[var(--color-primary)]" />
            <div>
              <p className="text-sm text-gray-500">Tanggal Mulai</p>
              {canEdit ? (
                <form action={formAction} className="mt-1">
                  <ProjectUpdateHiddenFields project={project} exclude={["startDate"]} />
                  <Input
                    aria-label="Tanggal mulai project"
                    name="startDate"
                    type="date"
                    size="sm"
                    defaultValue={dateInputValue(project.startDate)}
                    onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                  />
                </form>
              ) : (
                <p className="font-semibold">{formatProjectDate(project.startDate)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="text-[var(--color-secondary)]" />
            <div>
              <p className="text-sm text-gray-500">Tanggal Selesai</p>
              {canEdit ? (
                <form action={formAction} className="mt-1">
                  <ProjectUpdateHiddenFields project={project} exclude={["endDate"]} />
                  <Input
                    aria-label="Tanggal selesai project"
                    name="endDate"
                    type="date"
                    size="sm"
                    defaultValue={dateInputValue(project.endDate)}
                    onBlur={(event) => event.currentTarget.form?.requestSubmit()}
                  />
                </form>
              ) : (
                <p className="font-semibold">{formatProjectDate(project.endDate)}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[var(--color-text-main)]">
            Kolaborasi Project
          </h2>
          {canManageMembers ? (
            <Button
              variant="light"
              className="font-semibold text-[var(--color-primary)]"
              startContent={<Plus size={17} />}
              onPress={() => setIsMembersModalOpen(true)}
            >
              Tambahkan Anggota
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <AvatarGroup max={8}>
            {project.members.map((member) => (
              <Tooltip
                key={member.id}
                content={`${member.name ?? member.email ?? member.userId} - ${member.role}`}
              >
                <Avatar
                  name={initials(member.name ?? member.email ?? member.userId)}
                  className="bg-[var(--color-primary)]/20 text-[var(--color-text-main)]"
                />
              </Tooltip>
            ))}
          </AvatarGroup>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={17} />
            <span>{project.members.length} anggota aktif di project ini</span>
          </div>
        </div>
      </section>

      {canManageMembers ? (
        <ProjectMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          projectId={project.id}
          members={project.members}
        />
      ) : null}
    </div>
  );
}
