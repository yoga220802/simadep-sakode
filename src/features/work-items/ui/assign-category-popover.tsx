"use client";

import { Button, Input, Listbox, ListboxItem, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { WorkItemCategory, WorkItemTask } from "../application/contracts";
import { updateTaskAction } from "../server/work-item-actions";
import { WorkItemActionForm } from "./work-item-action-form";
import { taskHiddenFields } from "./work-item-ui-utils";

type AssignCategoryPopoverProps = {
  projectId: string;
  task: WorkItemTask;
  categories: WorkItemCategory[];
  canEdit: boolean;
  children: React.ReactNode;
};

function CategoryUpdateForm({
  projectId,
  task,
  categoryId,
  children,
}: {
  projectId: string;
  task: WorkItemTask;
  categoryId: string;
  children: React.ReactNode;
}) {
  const fields = taskHiddenFields(task);
  return (
    <WorkItemActionForm action={updateTaskAction}>
      <input type="hidden" name="projectId" value={projectId} />
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <input type="hidden" name="categoryId" value={categoryId} />
      <button type="submit" className="w-full text-left">
        {children}
      </button>
    </WorkItemActionForm>
  );
}

export function AssignCategoryPopover({
  projectId,
  task,
  categories,
  canEdit,
  children,
}: AssignCategoryPopoverProps) {
  const [search, setSearch] = useState("");
  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        category.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [categories, search],
  );

  if (!canEdit) {
    return <>{children}</>;
  }

  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent className="p-2">
        <div className="w-72 space-y-2">
          <Input
            size="sm"
            label="Cari kategori"
            value={search}
            onValueChange={setSearch}
            startContent={<Search size={15} />}
          />
          <Listbox aria-label="Tetapkan kategori" className="max-h-60 overflow-y-auto">
            {filteredCategories.map((category) => (
              <ListboxItem key={category.id} textValue={category.name}>
                <CategoryUpdateForm
                  projectId={projectId}
                  task={task}
                  categoryId={task.categoryId === category.id ? "" : category.id}
                >
                  {category.name}
                </CategoryUpdateForm>
              </ListboxItem>
            ))}
          </Listbox>
          {task.categoryId ? (
            <CategoryUpdateForm projectId={projectId} task={task} categoryId="">
              <Button size="sm" color="danger" variant="light" className="w-full">
                Hapus Kategori
              </Button>
            </CategoryUpdateForm>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
