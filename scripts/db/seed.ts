import { closeDb, getDb, schema } from "@/src/infrastructure/db";
import { seedIds, seedReferenceDate } from "@/src/infrastructure/db/seed-data";

const adminId = seedIds.users.bootstrapAdmin;
const headId = seedIds.users.departmentHead;
const contributorId = seedIds.users.contributor;

const db = getDb();

async function main() {
  await db.transaction(async (tx) => {
    await tx
      .insert(schema.userProfiles)
      .values([
        {
          userId: adminId,
          employeeNumber: "SIMADEP-ADMIN",
          displayName: "Bootstrap Admin",
          position: "SIMADEP Bootstrap Administrator",
          workUnit: "Sakode",
          joinedAt: seedReferenceDate,
        },
        {
          userId: headId,
          employeeNumber: "SIMADEP-HEAD",
          displayName: "Department Head",
          position: "Head of Department",
          workUnit: "Engineering",
          joinedAt: seedReferenceDate,
        },
        {
          userId: contributorId,
          employeeNumber: "SIMADEP-CONTRIBUTOR",
          displayName: "Project Contributor",
          position: "Contributor",
          workUnit: "Engineering",
          joinedAt: seedReferenceDate,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.departments)
      .values([
        {
          id: seedIds.departments.sakode,
          code: "SAKODE",
          name: "Sakode",
          description: "Bootstrap organization department.",
          createdBy: adminId,
        },
        {
          id: seedIds.departments.engineering,
          code: "ENG",
          name: "Engineering",
          description: "Product and engineering delivery.",
          createdBy: adminId,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          status: "active",
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.departmentMembers)
      .values([
        {
          id: "11000000-0000-4000-8000-000000000001",
          departmentId: seedIds.departments.sakode,
          userId: adminId,
          role: "department_admin",
          joinedAt: seedReferenceDate,
        },
        {
          id: "11000000-0000-4000-8000-000000000002",
          departmentId: seedIds.departments.engineering,
          userId: headId,
          role: "head",
          joinedAt: seedReferenceDate,
        },
        {
          id: "11000000-0000-4000-8000-000000000003",
          departmentId: seedIds.departments.engineering,
          userId: contributorId,
          role: "member",
          joinedAt: seedReferenceDate,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          status: "active",
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.projects)
      .values([
        {
          id: seedIds.projects.transformation,
          departmentId: seedIds.departments.engineering,
          title: "SIMADEP Transformation",
          description: "Rebuild department management workflows in Next.js.",
          status: "active",
          createdBy: headId,
        },
        {
          id: seedIds.projects.operations,
          departmentId: seedIds.departments.sakode,
          title: "Operational Readiness",
          description: "Prepare bootstrap operational data for local testing.",
          status: "draft",
          createdBy: adminId,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          updatedAt: seedReferenceDate,
        },
      });

    await tx
      .insert(schema.projectMembers)
      .values([
        {
          id: "21000000-0000-4000-8000-000000000001",
          projectId: seedIds.projects.transformation,
          userId: headId,
          role: "owner",
          createdBy: adminId,
        },
        {
          id: "21000000-0000-4000-8000-000000000002",
          projectId: seedIds.projects.transformation,
          userId: contributorId,
          role: "contributor",
          createdBy: headId,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
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
          createdBy: headId,
        },
        {
          id: seedIds.tasks.architectureScaffold,
          projectId: seedIds.projects.transformation,
          milestoneId: seedIds.milestones.foundation,
          categoryId: seedIds.categories.frontend,
          name: "Prepare feature architecture scaffold",
          status: "done",
          priority: "medium",
          displayOrder: 2,
          createdBy: adminId,
        },
        {
          id: seedIds.tasks.rebrand,
          projectId: seedIds.projects.transformation,
          milestoneId: seedIds.milestones.foundation,
          categoryId: seedIds.categories.frontend,
          name: "Apply SIMADEP rebrand",
          status: "done",
          priority: "medium",
          displayOrder: 3,
          createdBy: adminId,
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
          assignedBy: headId,
          assignedAt: seedReferenceDate,
        },
        {
          id: "51000000-0000-4000-8000-000000000002",
          taskId: seedIds.tasks.architectureScaffold,
          userId: headId,
          assignedBy: adminId,
          assignedAt: seedReferenceDate,
        },
      ])
      .onDuplicateKeyUpdate({
        set: {
          assignedAt: seedReferenceDate,
        },
      });
  });
}

main()
  .then(async () => {
    await closeDb();
    console.log("Deterministic local seed completed.");
  })
  .catch(async (error: unknown) => {
    await closeDb();
    console.error(error);
    process.exitCode = 1;
  });
