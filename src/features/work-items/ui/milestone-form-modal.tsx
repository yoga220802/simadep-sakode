"use client";

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

import type { WorkItemMilestone } from "../application/contracts";
import {
  createMilestoneAction,
  updateMilestoneAction,
} from "../server/work-item-actions";
import { WorkItemActionForm } from "./work-item-action-form";

type MilestoneFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  milestone?: WorkItemMilestone | null;
};

export function MilestoneFormModal({
  isOpen,
  onClose,
  projectId,
  milestone,
}: MilestoneFormModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <ModalHeader>{milestone ? "Edit Milestone" : "Buat Milestone"}</ModalHeader>
        <ModalBody>
          <WorkItemActionForm
            action={milestone ? updateMilestoneAction : createMilestoneAction}
          >
            <input type="hidden" name="projectId" value={projectId} />
            {milestone ? (
              <>
                <input type="hidden" name="milestoneId" value={milestone.id} />
                <Input
                  name="displayOrder"
                  label="Urutan"
                  type="number"
                  defaultValue={String(milestone.displayOrder)}
                />
              </>
            ) : null}
            <Input
              name="title"
              label="Nama milestone"
              defaultValue={milestone?.title ?? ""}
              isRequired
            />
            <ModalFooter className="px-0">
              <Button variant="light" onPress={onClose}>
                Batal
              </Button>
              <Button
                type="submit"
                color="primary"
                className="bg-[var(--color-primary)] font-bold text-[var(--simadep-foreground)]"
              >
                Simpan
              </Button>
            </ModalFooter>
          </WorkItemActionForm>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
