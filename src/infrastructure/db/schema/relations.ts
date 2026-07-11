import "@/src/infrastructure/server-only";

import { relations } from "drizzle-orm";

import { account, session, user, verification } from "./auth.schema";
import { auditLogs } from "./audit.schema";
import { attachments, comments } from "./collaboration.schema";
import { departmentMembers, departments } from "./departments.schema";
import { userProfiles } from "./identity.schema";
import { deviceTokens, notifications } from "./notifications.schema";
import { outboxEvents } from "./outbox.schema";
import { projectMembers, projects } from "./projects.schema";
import {
  milestones,
  projectTaskStatuses,
  taskAssignees,
  taskCategories,
  tasks,
} from "./work-items.schema";

export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  departmentMemberships: many(departmentMembers),
  projectMemberships: many(projectMembers),
  taskAssignments: many(taskAssignees),
  comments: many(comments),
  notifications: many(notifications),
  deviceTokens: many(deviceTokens),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [user.id],
    references: [userProfiles.userId],
  }),
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const verificationRelations = relations(verification, () => ({}));

export const departmentsRelations = relations(departments, ({ many }) => ({
  members: many(departmentMembers),
  projects: many(projects),
  auditLogs: many(auditLogs),
}));

export const departmentMembersRelations = relations(
  departmentMembers,
  ({ one }) => ({
    department: one(departments, {
      fields: [departmentMembers.departmentId],
      references: [departments.id],
    }),
  }),
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  department: one(departments, {
    fields: [projects.departmentId],
    references: [departments.id],
  }),
  members: many(projectMembers),
  milestones: many(milestones),
  categories: many(taskCategories),
  taskStatuses: many(projectTaskStatuses),
  tasks: many(tasks),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  project: one(projects, {
    fields: [milestones.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const taskCategoriesRelations = relations(
  taskCategories,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [taskCategories.projectId],
      references: [projects.id],
    }),
    tasks: many(tasks),
  }),
);

export const projectTaskStatusesRelations = relations(
  projectTaskStatuses,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectTaskStatuses.projectId],
      references: [projects.id],
    }),
  }),
);

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  milestone: one(milestones, {
    fields: [tasks.milestoneId],
    references: [milestones.id],
  }),
  parent: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
    relationName: "task_subtasks",
  }),
  subtasks: many(tasks, {
    relationName: "task_subtasks",
  }),
  category: one(taskCategories, {
    fields: [tasks.categoryId],
    references: [taskCategories.id],
  }),
  assignees: many(taskAssignees),
  comments: many(comments),
  attachments: many(attachments),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignees.taskId],
    references: [tasks.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  task: one(tasks, {
    fields: [attachments.taskId],
    references: [tasks.id],
  }),
  comment: one(comments, {
    fields: [attachments.commentId],
    references: [comments.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [notifications.taskId],
    references: [tasks.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  department: one(departments, {
    fields: [auditLogs.departmentId],
    references: [departments.id],
  }),
  project: one(projects, {
    fields: [auditLogs.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [auditLogs.taskId],
    references: [tasks.id],
  }),
}));

export const outboxEventsRelations = relations(outboxEvents, () => ({}));
