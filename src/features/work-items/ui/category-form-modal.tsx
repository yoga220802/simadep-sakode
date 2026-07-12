"use client";

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";

import type { WorkItemCategory } from "../application/contracts";
import {
  createCategoryAction,
  updateCategoryAction,
} from "../server/work-item-actions";
import { WorkItemActionForm } from "./work-item-action-form";

type CategoryFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  category?: WorkItemCategory | null;
};

export function CategoryFormModal({
  isOpen,
  onClose,
  projectId,
  category,
}: CategoryFormModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <ModalHeader>{category ? "Edit Kategori" : "Tambah Kategori"}</ModalHeader>
        <ModalBody>
          <WorkItemActionForm
            action={category ? updateCategoryAction : createCategoryAction}
          >
            <input type="hidden" name="projectId" value={projectId} />
            {category ? (
              <input type="hidden" name="categoryId" value={category.id} />
            ) : null}
            <Input
              name="name"
              label="Nama kategori"
              defaultValue={category?.name ?? ""}
              isRequired
            />
            <Textarea
              name="description"
              label="Deskripsi"
              defaultValue={category?.description ?? ""}
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
