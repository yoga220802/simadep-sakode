"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import type {
  AssignableProjectUser,
  ProjectMemberItem,
} from "../application/contracts";
import { projectRoles } from "../domain/project-policy";
import {
  addProjectMemberAction,
  removeProjectMemberAction,
  updateProjectMemberAction,
} from "../server/project-actions";
import { projectActionInitialState } from "../server/action-state";
import { useActionToast } from "@/src/shared/ui/use-action-toast";

type ProjectMembersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  members: ProjectMemberItem[];
};

type AssignableResponse = {
  items: AssignableProjectUser[];
};

function ActionMessage({ state }: { state: typeof projectActionInitialState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p className={state.ok ? "text-xs text-[var(--color-accent)]" : "text-xs text-[var(--color-secondary)]"}>
      {state.message}
    </p>
  );
}

function MemberRow({
  projectId,
  member,
}: {
  projectId: string;
  member: ProjectMemberItem;
}) {
  const router = useRouter();
  const [updateState, updateAction, isUpdating] = useActionState(
    updateProjectMemberAction,
    projectActionInitialState,
  );
  const [removeState, removeAction, isRemoving] = useActionState(
    removeProjectMemberAction,
    projectActionInitialState,
  );
  useActionToast(updateState, {
    isPending: isUpdating,
    loadingMessage: "Menyimpan role anggota project...",
  });
  useActionToast(removeState, {
    isPending: isRemoving,
    loadingMessage: "Menghapus anggota project...",
  });

  useEffect(() => {
    if (
      (updateState.ok && updateState.message) ||
      (removeState.ok && removeState.message)
    ) {
      router.refresh();
    }
  }, [
    removeState.message,
    removeState.ok,
    router,
    updateState.message,
    updateState.ok,
  ]);

  return (
    <tr className="border-b align-top">
      <td className="py-3 pr-4">
        <p className="font-semibold">{member.name ?? member.userId}</p>
        <p className="text-xs text-gray-500">{member.email}</p>
        <ActionMessage state={updateState} />
        <ActionMessage state={removeState} />
      </td>
      <td className="py-3 pr-4">
        <form action={updateAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="memberId" value={member.id} />
          <select
            name="role"
            defaultValue={member.role}
            className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
          >
            {projectRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="bordered" isLoading={isUpdating}>
            Simpan
          </Button>
        </form>
      </td>
      <td className="py-3 pr-4">
        <form action={removeAction}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="memberId" value={member.id} />
          <Button
            type="submit"
            size="sm"
            color="danger"
            variant="flat"
            isDisabled={member.role === "owner"}
            isLoading={isRemoving}
          >
            Hapus
          </Button>
        </form>
      </td>
    </tr>
  );
}

export function ProjectMembersModal({
  isOpen,
  onClose,
  projectId,
  members,
}: ProjectMembersModalProps) {
  const router = useRouter();
  const [users, setUsers] = useState<AssignableProjectUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addState, addAction, isAdding] = useActionState(
    addProjectMemberAction,
    projectActionInitialState,
  );
  useActionToast(addState, {
    isPending: isAdding,
    loadingMessage: "Menambahkan anggota project...",
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetch(`/api/projects/${projectId}/assignable-users`, { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as AssignableResponse | { error: string };
        if (!response.ok) {
          throw new Error("error" in data ? data.error : "Gagal memuat pengguna.");
        }
        if (!("items" in data)) {
          throw new Error("Gagal memuat pengguna.");
        }
        if (!cancelled) {
          setUsers(data.items);
        }
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Gagal memuat pengguna.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, projectId]);

  useEffect(() => {
    if (addState.ok && addState.message) {
      router.refresh();
    }
  }, [addState.message, addState.ok, router]);

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="4xl">
      <ModalContent>
        <ModalHeader>Kelola Anggota Project</ModalHeader>
        <ModalBody className="space-y-5">
          <form action={addAction} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <input type="hidden" name="projectId" value={projectId} />
            {isLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500">
                <Spinner size="sm" /> Memuat pengguna...
              </div>
            ) : (
              <Select name="userId" label="Pengguna" isRequired>
                {users.map((user) => (
                  <SelectItem key={user.id}>
                    {user.name ?? user.email ?? user.id}
                  </SelectItem>
                ))}
              </Select>
            )}
            <Select name="role" label="Role" defaultSelectedKeys={["contributor"]}>
              {projectRoles.map((role) => (
                <SelectItem key={role}>{role}</SelectItem>
              ))}
            </Select>
            <Button
              type="submit"
              color="primary"
              className="self-end bg-[var(--color-secondary)] font-bold text-white"
              startContent={<UserPlus size={16} />}
              isLoading={isAdding}
              isDisabled={isLoading || users.length === 0}
            >
              Tambah
            </Button>
            <div className="md:col-span-3">
              {error ? <p className="text-sm text-[var(--color-secondary)]">{error}</p> : null}
              <ActionMessage state={addState} />
            </div>
          </form>

          <div className="max-h-[45vh] overflow-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Pengguna</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <MemberRow key={member.id} projectId={projectId} member={member} />
                ))}
              </tbody>
            </table>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Tutup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
