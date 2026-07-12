import { z } from "zod";

import { departmentRoles } from "../domain/department-policy";

export const departmentStatusSchema = z.enum(["active", "archived"]);

export const departmentListInputSchema = z.object({
  query: z.string().trim().max(120).optional(),
  status: departmentStatusSchema.optional(),
});

export const createDepartmentInputSchema = z.object({
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
});

export const updateDepartmentInputSchema = z.object({
  departmentId: z.string().uuid(),
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
});

export const archiveDepartmentInputSchema = z.object({
  departmentId: z.string().uuid(),
});

export const addDepartmentMemberInputSchema = z.object({
  departmentId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(departmentRoles),
});

export const updateDepartmentMemberInputSchema = z.object({
  departmentId: z.string().uuid(),
  memberId: z.string().uuid(),
  role: z.enum(departmentRoles),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const removeDepartmentMemberInputSchema = z.object({
  departmentId: z.string().uuid(),
  memberId: z.string().uuid(),
});

export type DepartmentListInput = z.infer<typeof departmentListInputSchema>;
export type CreateDepartmentInput = z.infer<
  typeof createDepartmentInputSchema
>;
export type UpdateDepartmentInput = z.infer<
  typeof updateDepartmentInputSchema
>;
export type ArchiveDepartmentInput = z.infer<
  typeof archiveDepartmentInputSchema
>;
export type AddDepartmentMemberInput = z.infer<
  typeof addDepartmentMemberInputSchema
>;
export type UpdateDepartmentMemberInput = z.infer<
  typeof updateDepartmentMemberInputSchema
>;
export type RemoveDepartmentMemberInput = z.infer<
  typeof removeDepartmentMemberInputSchema
>;

export type DepartmentListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
  actorRole: string | null;
  memberCount: number;
  headCount: number;
};

export type DepartmentMemberItem = {
  id: string;
  departmentId: string;
  userId: string;
  role: string;
  status: string;
  displayName: string | null;
  email: string | null;
  joinedAt: Date;
};
