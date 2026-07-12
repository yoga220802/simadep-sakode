import { z } from "zod";

export const auditActivityInputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  projectId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});

export type AuditActivityInput = z.input<typeof auditActivityInputSchema>;

export type AuditActivityItem = {
  id: string;
  actorId: string | null;
  actorName: string;
  actionType: string;
  resourceType: string;
  resourceId: string | null;
  departmentId: string | null;
  departmentName: string | null;
  projectId: string | null;
  projectTitle: string | null;
  taskId: string | null;
  taskName: string | null;
  createdAt: string;
};
