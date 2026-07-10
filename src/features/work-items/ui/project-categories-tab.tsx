"use client";

import { useState } from "react";
import { Button, Tooltip } from "@heroui/react";
import { Edit, Plus, Trash2 } from "lucide-react";

import type { ProjectWorkItems, WorkItemCategory } from "../application/contracts";
import { deleteCategoryAction } from "../server/work-item-actions";
import { CategoryFormModal } from "./category-form-modal";
import { WorkItemConfirmationModal } from "./work-item-confirmation-modal";

type ProjectCategoriesTabProps = {
  projectId: string;
  workItems: ProjectWorkItems;
};

export function ProjectCategoriesTab({
  projectId,
  workItems,
}: ProjectCategoriesTabProps) {
  const [categoryToEdit, setCategoryToEdit] = useState<WorkItemCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] =
    useState<WorkItemCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-main)]">
            Manajemen Kategori Tugas
          </h2>
          <p className="text-sm text-gray-500">
            Kategori dipakai untuk mengelompokkan tugas dalam project ini.
          </p>
        </div>
        {workItems.canManage ? (
          <Button
            color="primary"
            className="bg-[var(--color-primary)] font-bold text-[var(--simadep-foreground)]"
            startContent={<Plus size={18} />}
            onPress={() => {
              setCategoryToEdit(null);
              setIsFormOpen(true);
            }}
          >
            Tambah Kategori
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nama Kategori</th>
              <th className="px-4 py-3">Deskripsi</th>
              {workItems.canManage ? <th className="px-4 py-3">Aksi</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workItems.categories.length ? (
              workItems.categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 font-semibold">{category.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {category.description || "-"}
                  </td>
                  {workItems.canManage ? (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Tooltip content="Edit">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => {
                              setCategoryToEdit(category);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit size={15} />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Hapus" color="danger">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => setCategoryToDelete(category)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </Tooltip>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={workItems.canManage ? 3 : 2}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Belum ada kategori untuk project ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        projectId={projectId}
        category={categoryToEdit}
      />
      <WorkItemConfirmationModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        title="Hapus kategori?"
        message={`Kategori "${categoryToDelete?.name ?? ""}" akan dihapus dari tugas yang memakai kategori ini.`}
        action={deleteCategoryAction}
        fields={{ projectId, categoryId: categoryToDelete?.id ?? "" }}
      />
    </div>
  );
}
