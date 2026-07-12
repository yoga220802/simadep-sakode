import { z } from "zod";

import { taskPriorities } from "../domain/work-item-policy";

const optionalDateSchema = z
  .union([z.string().date(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalUuidSchema = z
  .union([z.string().uuid(), z.literal("")])
  .optional()
  .transform((value) => (value ? value : undefined));

const taskStatusValueSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9_-]+$/, "Status hanya boleh berisi huruf kecil, angka, dash, dan underscore.");

function validateTaskDateRange(
  input: { startDate?: string; dueDate?: string },
  context: z.RefinementCtx,
) {
  if (input.startDate && input.dueDate && input.startDate > input.dueDate) {
    context.addIssue({
      code: "custom",
      path: ["dueDate"],
      message: "Tenggat tugas tidak boleh lebih awal dari tanggal mulai.",
    });
  }
}

export const taskSortFields = [
  "display_order",
  "due_date",
  "start_date",
  "title",
  "created_at",
  "priority",
  "status",
] as const;

export const workItemListInputSchema = z.object({
  sortBy: z.enum(taskSortFields).default("display_order"),
  descending: z.coerce.boolean().default(false),
  status: taskStatusValueSchema.optional(),
  categoryId: z.string().uuid().optional(),
  assignedToMe: z.coerce.boolean().optional(),
  search: z.string().trim().max(120).optional(),
});

export const myTaskListInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: taskStatusValueSchema.optional(),
});

export const createMilestoneInputSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
});

export const updateMilestoneInputSchema = z.object({
  milestoneId: z.string().uuid(),
  title: z.string().trim().min(2).max(200).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

export const reorderMilestonesInputSchema = z.object({
  projectId: z.string().uuid(),
  orderedMilestoneIds: z.array(z.string().uuid()).min(1),
});

export const deleteMilestoneInputSchema = z.object({
  milestoneId: z.string().uuid(),
});

export const createCategoryInputSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
});

export const updateCategoryInputSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
});

export const deleteCategoryInputSchema = z.object({
  categoryId: z.string().uuid(),
});

export const createTaskStatusInputSchema = z.object({
  projectId: z.string().uuid(),
  label: z.string().trim().min(2).max(120),
});

const taskPayloadSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional(),
  status: taskStatusValueSchema.optional(),
  priority: z.enum(taskPriorities).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  startDate: optionalDateSchema,
  dueDate: optionalDateSchema,
  estimatedDurationMinutes: z.coerce.number().int().min(0).optional(),
  categoryId: optionalUuidSchema,
});

export const createTaskInputSchema = taskPayloadSchema.extend({
  milestoneId: z.string().uuid(),
  status: taskStatusValueSchema.default("pending"),
}).superRefine(validateTaskDateRange);

export const createSubtaskInputSchema = taskPayloadSchema.extend({
  parentTaskId: z.string().uuid(),
  status: taskStatusValueSchema.default("pending"),
}).superRefine(validateTaskDateRange);

export const updateTaskInputSchema = taskPayloadSchema.extend({
  taskId: z.string().uuid(),
  milestoneId: z.string().uuid().optional(),
  version: z.coerce.number().int().min(1),
}).superRefine(validateTaskDateRange);

export const deleteTaskInputSchema = z.object({
  taskId: z.string().uuid(),
});

export const assignTaskInputSchema = z.object({
  taskId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const unassignTaskInputSchema = assignTaskInputSchema;

export const changeTaskStatusInputSchema = z.object({
  taskId: z.string().uuid(),
  status: taskStatusValueSchema,
  version: z.coerce.number().int().min(1),
});

export type WorkItemListInput = z.input<typeof workItemListInputSchema>;
export type MyTaskListInput = z.input<typeof myTaskListInputSchema>;
export type CreateMilestoneInput = z.infer<typeof createMilestoneInputSchema>;
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneInputSchema>;
export type ReorderMilestonesInput = z.infer<typeof reorderMilestonesInputSchema>;
export type DeleteMilestoneInput = z.infer<typeof deleteMilestoneInputSchema>;
export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;
export type DeleteCategoryInput = z.infer<typeof deleteCategoryInputSchema>;
export type CreateTaskStatusInput = z.infer<typeof createTaskStatusInputSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskInputSchema>;
export type UnassignTaskInput = z.infer<typeof unassignTaskInputSchema>;
export type ChangeTaskStatusInput = z.infer<typeof changeTaskStatusInputSchema>;

export type WorkItemAssignee = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
};

export type WorkItemCategory = {
  id: string;
  name: string;
  description: string | null;
};

export type WorkItemStatus = {
  value: string;
  label: string;
  displayOrder: number;
  isDefault: boolean;
};

export type WorkItemTask = {
  id: string;
  projectId: string;
  milestoneId: string;
  parentId: string | null;
  categoryId: string | null;
  categoryName: string | null;
  name: string;
  description: string | null;
  status: string;
  priority: string | null;
  displayOrder: number;
  startDate: Date | null;
  dueDate: Date | null;
  estimatedDurationMinutes: number | null;
  finishedDurationMinutes: number | null;
  completedAt: Date | null;
  version: number;
  assignees: WorkItemAssignee[];
  subtasks: WorkItemTask[];
};

export type WorkItemMilestone = {
  id: string;
  projectId: string;
  title: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  tasks: WorkItemTask[];
};

export type ProjectWorkItems = {
  milestones: WorkItemMilestone[];
  categories: WorkItemCategory[];
  statuses: WorkItemStatus[];
  projectMembers: Array<{
    userId: string;
    name: string | null;
    email: string | null;
    role: string;
  }>;
  canManage: boolean;
};

export type MyTaskItem = {
  id: string;
  projectId: string;
  projectTitle: string;
  milestoneId: string;
  milestoneTitle: string;
  name: string;
  status: string;
  priority: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  finishedDurationMinutes: number | null;
  version: number;
};
