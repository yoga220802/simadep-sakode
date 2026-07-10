import { z } from "zod";

import { projectRoles, projectStatuses } from "../domain/project-policy";

export const projectListInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(9),
  search: z.string().trim().max(120).optional(),
  status: z.enum(projectStatuses).optional(),
  departmentId: z.string().uuid().optional(),
  startYear: z.coerce.number().int().min(1970).max(9999).optional(),
  endYear: z.coerce.number().int().min(1970).max(9999).optional(),
});

export const createProjectInputSchema = z.object({
  departmentId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional(),
  status: z.enum(projectStatuses).default("tender"),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
});

export const updateProjectInputSchema = createProjectInputSchema
  .omit({ departmentId: true })
  .extend({
    projectId: z.string().uuid(),
    version: z.coerce.number().int().min(1),
  });

export const archiveProjectInputSchema = z.object({
  projectId: z.string().uuid(),
});

export const addProjectMemberInputSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(projectRoles),
});

export const updateProjectMemberInputSchema = z.object({
  projectId: z.string().uuid(),
  memberId: z.string().uuid(),
  role: z.enum(projectRoles),
});

export const removeProjectMemberInputSchema = z.object({
  projectId: z.string().uuid(),
  memberId: z.string().uuid(),
});

export type ProjectListInput = z.input<typeof projectListInputSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;
export type ArchiveProjectInput = z.infer<typeof archiveProjectInputSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberInputSchema>;
export type UpdateProjectMemberInput = z.infer<
  typeof updateProjectMemberInputSchema
>;
export type RemoveProjectMemberInput = z.infer<
  typeof removeProjectMemberInputSchema
>;

export type ProjectListItem = {
  id: string;
  departmentId: string;
  departmentName: string | null;
  title: string;
  description: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdBy: string | null;
  version: number;
  totalTasks: number;
  memberCount: number;
  actorRole: string | null;
  capabilities: ProjectUiCapabilities;
};

export type ProjectMemberItem = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: Date;
};

export type ProjectDetail = ProjectListItem & {
  members: ProjectMemberItem[];
  completedTasks: number;
};

export type ProjectUiCapabilities = {
  canEditProject: boolean;
  canArchiveProject: boolean;
  canManageMembers: boolean;
  canViewTasks: boolean;
  canManageTasks: boolean;
  canManageCategories: boolean;
  canViewReport: boolean;
};

export type AssignableProjectUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

export type AssignableProjectUserPage = {
  items: AssignableProjectUser[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ProjectPage = {
  items: ProjectListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  summary: Record<"all" | "tender" | "active" | "completed" | "cancelled", number>;
};
