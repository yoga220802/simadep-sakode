import { hashPassword } from "better-auth/crypto";
import { and, eq, inArray, sql } from "drizzle-orm";

import { closeDb, getDb, schema } from "@/src/infrastructure/db";
import {
  seedIds,
  seedLoginPassword,
  seedReferenceDate,
  seedUsers,
} from "@/src/infrastructure/db/seed-data";

const adminId = seedIds.users.bootstrapAdmin;
const headId = seedIds.users.departmentHead;
const projectOwnerId = seedIds.users.projectOwner;
const projectManagerId = seedIds.users.projectManager;
const contributorId = seedIds.users.contributor;
const projectViewerId = seedIds.users.projectViewer;

const db = getDb();

type SeedDepartmentRole = "head" | "department_admin" | "member" | "viewer";

function seedDepartmentRoleForUser(userId: string): SeedDepartmentRole {
  if (userId === headId) {
    return "head";
  }

  if (userId === seedIds.users.departmentAdmin) {
    return "department_admin";
  }

  if (userId === seedIds.users.departmentViewer) {
    return "viewer";
  }

  return "member";
}

async function main() {
  const passwordHash = await hashPassword(seedLoginPassword);
  const seedUserIds = seedUsers.map((user) => user.id);

  await db.transaction(async (tx) => {
    await tx
      .insert(schema.user)
      .values(
        seedUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: true,
          role: user.role,
        })),
      )
      .onDuplicateKeyUpdate({
        set: {
          name: sql`values(${schema.user.name})`,
          emailVerified: true,
          role: sql`values(${schema.user.role})`,
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .delete(schema.account)
      .where(
        and(
          inArray(schema.account.userId, seedUserIds),
          eq(schema.account.providerId, "credential"),
        ),
      );

    await tx.insert(schema.account).values(
      seedUsers.map((user) => ({
        id: user.accountId,
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      })),
    );

    await tx
      .insert(schema.userProfiles)
      .values(
        seedUsers.map((user) => ({
          userId: user.id,
          employeeNumber: user.employeeNumber,
          displayName: user.name,
          position: user.position,
          workUnit: user.workUnit,
          joinedAt: seedReferenceDate,
        })),
      )
      .onDuplicateKeyUpdate({
        set: {
          employeeNumber: sql`values(${schema.userProfiles.employeeNumber})`,
          displayName: sql`values(${schema.userProfiles.displayName})`,
          position: sql`values(${schema.userProfiles.position})`,
          workUnit: sql`values(${schema.userProfiles.workUnit})`,
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.departments)
      .values([
        {
          id: seedIds.departments.sakode,
          code: "SIMADEP",
          name: "SIMADEP Department",
          description: "Primary seeded department for role and workflow testing.",
          createdBy: adminId,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          status: "active",
          name: sql`values(${schema.departments.name})`,
          description: sql`values(${schema.departments.description})`,
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.departmentMembers)
      .values(
        seedUsers.map((user, index) => ({
          id: `11000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
          departmentId: seedIds.departments.sakode,
          userId: user.id,
          role: seedDepartmentRoleForUser(user.id),
          joinedAt: seedReferenceDate,
        })),
      )
      .onDuplicateKeyUpdate({
        set: {
          role: sql`values(${schema.departmentMembers.role})`,
          status: "active",
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.projects)
      .values([
        {
          id: seedIds.projects.transformation,
          departmentId: seedIds.departments.sakode,
          title: "SIMADEP Role Workflow",
          description: "Seeded project for department, project, task, and assignment testing.",
          status: "active",
          createdBy: projectOwnerId,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          departmentId: sql`values(${schema.projects.departmentId})`,
          title: sql`values(${schema.projects.title})`,
          description: sql`values(${schema.projects.description})`,
          status: sql`values(${schema.projects.status})`,
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.projectMembers)
      .values([
        {
          id: "21000000-0000-4000-8000-000000000001",
          projectId: seedIds.projects.transformation,
          userId: projectOwnerId,
          role: "owner",
          createdBy: adminId,
        },
        {
          id: "21000000-0000-4000-8000-000000000002",
          projectId: seedIds.projects.transformation,
          userId: projectManagerId,
          role: "manager",
          createdBy: projectOwnerId,
        },
        {
          id: "21000000-0000-4000-8000-000000000003",
          projectId: seedIds.projects.transformation,
          userId: contributorId,
          role: "contributor",
          createdBy: projectOwnerId,
        },
        {
          id: "21000000-0000-4000-8000-000000000004",
          projectId: seedIds.projects.transformation,
          userId: projectViewerId,
          role: "viewer",
          createdBy: projectOwnerId,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          role: sql`values(${schema.projectMembers.role})`,
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.milestones)
      .values([
        {
          id: seedIds.milestones.foundation,
          projectId: seedIds.projects.transformation,
          title: "Foundation",
          displayOrder: 1,
        },
        {
          id: seedIds.milestones.adoption,
          projectId: seedIds.projects.transformation,
          title: "Adoption",
          displayOrder: 2,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.taskCategories)
      .values([
        {
          id: seedIds.categories.backend,
          projectId: seedIds.projects.transformation,
          name: "Backend",
          description: "Server-side and data foundation.",
        },
        {
          id: seedIds.categories.frontend,
          projectId: seedIds.projects.transformation,
          name: "Frontend",
          description: "User-facing application work.",
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.tasks)
      .values([
        {
          id: seedIds.tasks.databaseFoundation,
          projectId: seedIds.projects.transformation,
          milestoneId: seedIds.milestones.foundation,
          categoryId: seedIds.categories.backend,
          name: "Build database foundation",
          description: "Create Drizzle schema, migrations, and seed data.",
          status: "in_progress",
          priority: "high",
          displayOrder: 1,
          startDate: new Date("2026-01-02T00:00:00.000Z"),
          dueDate: new Date("2026-01-10T00:00:00.000Z"),
          estimatedDurationMinutes: 960,
          createdBy: projectOwnerId,
        },
        {
          id: seedIds.tasks.architectureScaffold,
          projectId: seedIds.projects.transformation,
          milestoneId: seedIds.milestones.foundation,
          categoryId: seedIds.categories.frontend,
          name: "Prepare feature architecture scaffold",
          status: "completed",
          priority: "medium",
          displayOrder: 2,
          startDate: new Date("2026-01-04T00:00:00.000Z"),
          dueDate: new Date("2026-01-12T00:00:00.000Z"),
          estimatedDurationMinutes: 720,
          finishedDurationMinutes: 660,
          completedAt: new Date("2026-01-11T09:00:00.000Z"),
          createdBy: projectManagerId,
        },
        {
          id: seedIds.tasks.rebrand,
          projectId: seedIds.projects.transformation,
          milestoneId: seedIds.milestones.foundation,
          categoryId: seedIds.categories.frontend,
          name: "Apply SIMADEP rebrand",
          status: "completed",
          priority: "medium",
          displayOrder: 3,
          startDate: new Date("2026-01-05T00:00:00.000Z"),
          dueDate: new Date("2026-01-15T00:00:00.000Z"),
          estimatedDurationMinutes: 540,
          finishedDurationMinutes: 500,
          completedAt: new Date("2026-01-14T10:00:00.000Z"),
          createdBy: projectManagerId,
        },
        {
          id: seedIds.tasks.departmentPermissions,
          projectId: seedIds.projects.transformation,
          milestoneId: seedIds.milestones.adoption,
          categoryId: seedIds.categories.backend,
          name: "Validate role permissions",
          description: "Verify department, project, and assigned task permissions.",
          status: "pending",
          priority: "high",
          displayOrder: 1,
          startDate: new Date("2026-01-16T00:00:00.000Z"),
          dueDate: new Date("2026-01-24T00:00:00.000Z"),
          estimatedDurationMinutes: 480,
          createdBy: projectOwnerId,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.taskAssignees)
      .values([
        {
          id: "51000000-0000-4000-8000-000000000001",
          taskId: seedIds.tasks.databaseFoundation,
          userId: contributorId,
          assignedBy: projectManagerId,
          assignedAt: seedReferenceDate,
        },
        {
          id: "51000000-0000-4000-8000-000000000002",
          taskId: seedIds.tasks.architectureScaffold,
          userId: projectManagerId,
          assignedBy: projectOwnerId,
          assignedAt: seedReferenceDate,
        },
        {
          id: "51000000-0000-4000-8000-000000000003",
          taskId: seedIds.tasks.rebrand,
          userId: projectOwnerId,
          assignedBy: projectManagerId,
          assignedAt: seedReferenceDate,
        },
        {
          id: "51000000-0000-4000-8000-000000000004",
          taskId: seedIds.tasks.departmentPermissions,
          userId: contributorId,
          assignedBy: projectManagerId,
          assignedAt: seedReferenceDate,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          assignedAt: seedReferenceDate,
        },
      });

    await tx
      .delete(schema.projectMembers)
      .where(eq(schema.projectMembers.projectId, seedIds.projects.operations));

    await tx
      .delete(schema.projects)
      .where(eq(schema.projects.id, seedIds.projects.operations));

    await tx
      .delete(schema.departments)
      .where(eq(schema.departments.id, seedIds.departments.engineering));
  });
}

main()
  .then(async () => {
    await closeDb();
    console.log("Deterministic local seed completed.");
    console.log(
      `Seed login password for local accounts: ${seedLoginPassword}`,
    );
  })
  .catch(async (error: unknown) => {
    await closeDb();
    console.error(error);
    process.exitCode = 1;
  });
