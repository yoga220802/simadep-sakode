"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

import type { WorkItemActionResult } from "../server/action-state";
import { WorkItemActionForm } from "./work-item-action-form";

type WorkItemAction = (
  previousState: WorkItemActionResult,
  formData: FormData,
) => Promise<WorkItemActionResult>;

type WorkItemConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  action: WorkItemAction;
  fields: Record<string, string>;
  confirmLabel?: string;
};

export function WorkItemConfirmationModal({
  isOpen,
  onClose,
  title,
  message,
  action,
  fields,
  confirmLabel = "Hapus",
}: WorkItemConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600">{message}</p>
          <WorkItemActionForm action={action}>
            {Object.entries(fields).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
            <ModalFooter className="px-0">
              <Button variant="light" onPress={onClose}>
                Batal
              </Button>
              <Button type="submit" color="danger" variant="flat">
                {confirmLabel}
              </Button>
            </ModalFooter>
          </WorkItemActionForm>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
