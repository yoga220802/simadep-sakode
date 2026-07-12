"use client";

import { useActionState, useEffect } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";

import type { ProjectUiRecord } from "./project-ui-utils";
import { dateInputValue } from "./project-ui-utils";
import { projectStatuses } from "../domain/project-policy";
import {
  createProjectAction,
  updateProjectAction,
} from "../server/project-actions";
import { projectActionInitialState } from "../server/action-state";
import { useActionToast } from "@/src/shared/ui/use-action-toast";

type DepartmentOption = {
  id: string;
  name: string;
  code: string;
};

type ProjectFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentOption[];
  project?: ProjectUiRecord | null;
};

export function ProjectFormModal({
  isOpen,
  onClose,
  departments,
  project,
}: ProjectFormModalProps) {
  const router = useRouter();
  const isEdit = Boolean(project);
  const [createState, createAction, isCreating] = useActionState(
    createProjectAction,
    projectActionInitialState,
  );
  const [updateState, updateAction, isUpdating] = useActionState(
    updateProjectAction,
    projectActionInitialState,
  );
  const state = isEdit ? updateState : createState;
  const formAction = isEdit ? updateAction : createAction;
  const isPending = isEdit ? isUpdating : isCreating;
  useActionToast(createState);
  useActionToast(updateState);

  useEffect(() => {
    if (state.ok && state.message) {
      if (isEdit) {
        onClose();
        router.refresh();
      } else if (state.projectId) {
        router.push(`/projects/${state.projectId}`);
      }
    }
  }, [isEdit, onClose, router, state.message, state.ok, state.projectId]);

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="2xl">
      <ModalContent>
        <form action={formAction}>
          <ModalHeader>{isEdit ? "Edit Project" : "Buat Project"}</ModalHeader>
          <ModalBody className="grid gap-3">
            {project ? (
              <>
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="version" value={project.version} />
              </>
            ) : null}

            {!project ? (
              <Select name="departmentId" label="Departemen" isRequired>
                {departments.map((department) => (
                  <SelectItem key={department.id}>
                    {department.name} ({department.code})
                  </SelectItem>
                ))}
              </Select>
            ) : null}

            <Input
              name="title"
              label="Nama project"
              defaultValue={project?.title ?? ""}
              isRequired
            />
            <Select
              name="status"
              label="Status"
              defaultSelectedKeys={[project?.status ?? "tender"]}
            >
              {projectStatuses.map((status) => (
                <SelectItem key={status}>{status}</SelectItem>
              ))}
            </Select>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                name="startDate"
                label="Tanggal mulai"
                type="date"
                defaultValue={dateInputValue(project?.startDate ?? null)}
              />
              <Input
                name="endDate"
                label="Tanggal selesai"
                type="date"
                defaultValue={dateInputValue(project?.endDate ?? null)}
              />
            </div>
            <Textarea
              name="description"
              label="Deskripsi"
              minRows={4}
              defaultValue={project?.description ?? ""}
            />
            {state.message ? (
              <p className={state.ok ? "text-sm text-[var(--color-accent)]" : "text-sm text-[var(--color-secondary)]"}>
                {state.message}
              </p>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Batal
            </Button>
            <Button
              type="submit"
              color="primary"
              className="bg-[var(--color-primary)] font-bold text-[var(--simadep-foreground)]"
              isLoading={isPending}
              startContent={<Save size={16} />}
            >
              {isEdit ? "Simpan" : "Buat Project"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
