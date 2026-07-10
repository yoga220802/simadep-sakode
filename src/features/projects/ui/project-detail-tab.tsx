"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarGroup,
  Button,
  Tooltip,
} from "@heroui/react";
import { Calendar, Pencil, Plus, Users } from "lucide-react";

import type { ProjectDetail } from "../application/contracts";
import { ProjectFormModal } from "./project-form-modal";
import { ProjectMembersModal } from "./project-members-modal";
import { formatProjectDate, initials } from "./project-ui-utils";

type DepartmentOption = {
  id: string;
  name: string;
  code: string;
};

type ProjectDetailTabProps = {
  project: ProjectDetail;
  departments: DepartmentOption[];
};

export function ProjectDetailTab({
  project,
  departments,
}: ProjectDetailTabProps) {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const canEdit = project.capabilities.canEditProject;
  const canManageMembers = project.capabilities.canManageMembers;

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[var(--color-text-main)]">
            Deskripsi Project
          </h2>
          {canEdit ? (
            <Button
              isIconOnly
              variant="light"
              aria-label="Edit project"
              onPress={() => setIsProjectModalOpen(true)}
            >
              <Pencil size={18} />
            </Button>
          ) : null}
        </div>
        <p className="max-w-4xl whitespace-pre-wrap text-gray-600">
          {project.description || (
            <span className="italic text-gray-400">
              Tidak ada deskripsi untuk project ini.
            </span>
          )}
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-[var(--color-text-main)]">
            Jadwal Project
          </h2>
          {canEdit ? (
            <Button
              isIconOnly
              variant="light"
              aria-label="Edit jadwal"
              onPress={() => setIsScheduleModalOpen(true)}
            >
              <Pencil size={18} />
            </Button>
          ) : null}
        </div>
        <div className="flex flex-col gap-5 text-gray-700 sm:flex-row sm:gap-10">
          <div className="flex items-center gap-3">
            <Calendar className="text-[var(--color-primary)]" />
            <div>
              <p className="text-sm text-gray-500">Tanggal Mulai</p>
              <p className="font-semibold">{formatProjectDate(project.startDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="text-[var(--color-secondary)]" />
            <div>
              <p className="text-sm text-gray-500">Tanggal Selesai</p>
              <p className="font-semibold">{formatProjectDate(project.endDate)}</p>
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

      <ProjectFormModal
        isOpen={isProjectModalOpen || isScheduleModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setIsScheduleModalOpen(false);
        }}
        departments={departments}
        project={project}
      />
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
