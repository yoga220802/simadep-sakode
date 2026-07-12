import { z } from "zod";

import { globalRoles } from "./policy";

export const defaultManagedUserPassword = "simadep@sakode";

export const createManagedUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8).default(defaultManagedUserPassword),
  role: z.enum(globalRoles).default("user"),
  employeeNumber: z.string().max(50).optional(),
  displayName: z.string().min(1).max(150).optional(),
  position: z.string().max(120).optional(),
  workUnit: z.string().max(150).optional(),
  phone: z.string().max(50).optional(),
});

export const updateUserProfileInputSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  employeeNumber: z.string().max(50).nullable().optional(),
  displayName: z.string().min(1).max(150),
  position: z.string().max(120).nullable().optional(),
  workUnit: z.string().max(150).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const updateOwnPasswordInputSchema = z.object({
  userId: z.string().uuid(),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const resetManagedUserPasswordInputSchema = z.object({
  targetUserId: z.string().uuid(),
  password: z.string().min(8).default(defaultManagedUserPassword),
});

export const bulkCreateManagedUsersInputSchema = z.object({
  users: z.array(createManagedUserInputSchema).min(1).max(500),
});

export const setGlobalRoleInputSchema = z.object({
  targetUserId: z.string().uuid(),
  role: z.enum(globalRoles),
});

export const banUserInputSchema = z.object({
  targetUserId: z.string().uuid(),
  reason: z.string().min(1).max(500).optional(),
  expiresAt: z.date().nullable().optional(),
});

export const revokeUserSessionInputSchema = z.object({
  targetUserId: z.string().uuid(),
  sessionToken: z.string().min(1).optional(),
});

export type CreateManagedUserInput = z.infer<
  typeof createManagedUserInputSchema
>;
export type UpdateUserProfileInput = z.infer<
  typeof updateUserProfileInputSchema
>;
export type UpdateOwnPasswordInput = z.infer<typeof updateOwnPasswordInputSchema>;
export type ResetManagedUserPasswordInput = z.infer<
  typeof resetManagedUserPasswordInputSchema
>;
export type BulkCreateManagedUsersInput = z.infer<
  typeof bulkCreateManagedUsersInputSchema
>;
export type SetGlobalRoleInput = z.infer<typeof setGlobalRoleInputSchema>;
export type BanUserInput = z.infer<typeof banUserInputSchema>;
export type RevokeUserSessionInput = z.infer<
  typeof revokeUserSessionInputSchema
>;
