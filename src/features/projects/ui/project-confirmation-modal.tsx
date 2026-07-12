"use client";

import { useActionState, useEffect } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { Archive } from "lucide-react";
import { useRouter } from "next/navigation";

import { archiveProjectAction } from "../server/project-actions";
import { projectActionInitialState } from "../server/action-state";
import { useActionToast } from "@/src/shared/ui/use-action-toast";

type ProjectArchiveConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  project?: {
    id: string;
    title: string;
  } | null;
};

export function ProjectArchiveConfirmationModal({
  isOpen,
  onClose,
  project,
}: ProjectArchiveConfirmationModalProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    archiveProjectAction,
    projectActionInitialState,
  );
  useActionToast(state);

  useEffect(() => {
    if (state.ok && state.message) {
      onClose();
      router.refresh();
    }
  }, [onClose, router, state.message, state.ok]);

  if (!project) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <form action={formAction}>
          <input type="hidden" name="projectId" value={project.id} />
          <ModalHeader>Arsipkan project?</ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600">
              Project <span className="font-semibold">{project.title}</span> akan
              diarsipkan dan tidak muncul pada daftar aktif. Aksi ini tetap melalui
              validasi server.
            </p>
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
              color="danger"
              variant="flat"
              isLoading={isPending}
              startContent={<Archive size={16} />}
            >
              Arsipkan
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
