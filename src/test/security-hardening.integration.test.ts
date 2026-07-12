import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import {
  getDepartmentActor,
  listDepartmentMembersForActor,
  listDepartmentsForActor,
} from "@/src/features/departments/application/department-use-cases";
import {
  getProjectActor,
  getProjectDetailForActor,
  listProjectsForActor,
  updateProject,
} from "@/src/features/projects/application/project-use-cases";
import { closeDb, getDb, inTransaction, schema } from "@/src/infrastructure/db";
import { seedIds } from "@/src/infrastructure/db/seed-data";

const runDbTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDbTests)("security hardening DB integration", () => {
  afterAll(async () => {
    await closeDb();
  });

  it("scopes project reads by actor project and department memberships", async () => {
    const contributor = await getProjectActor(seedIds.users.contributor);
    const outsideDepartmentId = "90000000-0000-4000-8000-000000000101";
    const outsideProjectId = "90000000-0000-4000-8000-000000000102";

    await getDb()
      .delete(schema.projects)
      .where(eq(schema.projects.id, outsideProjectId));
    await getDb()
      .delete(schema.departments)
      .where(eq(schema.departments.id, outsideDepartmentId));

    await getDb().insert(schema.departments).values({
      id: outsideDepartmentId,
      code: "SEC-OUT",
      name: "Security Outside Department",
      createdBy: seedIds.users.bootstrapAdmin,
    });
    await getDb().insert(schema.projects).values({
      id: outsideProjectId,
      departmentId: outsideDepartmentId,
      title: "Outside Project",
      status: "active",
      createdBy: seedIds.users.bootstrapAdmin,
    });

    const outsideDepartmentPage = await listProjectsForActor(contributor, {
      departmentId: outsideDepartmentId,
    });

    expect(outsideDepartmentPage.items).toHaveLength(0);

    await expect(
      getProjectDetailForActor(contributor, outsideProjectId),
    ).rejects.toThrow("You do not have access to this project.");
  });

  it("scopes department reads by active department membership", async () => {
    const head = await getDepartmentActor(seedIds.users.departmentHead);
    const departments = await listDepartmentsForActor(head);
    const outsideDepartmentId = "90000000-0000-4000-8000-000000000103";

    expect(departments.map((department) => department.id)).toContain(
      seedIds.departments.sakode,
    );

    await getDb()
      .delete(schema.departments)
      .where(eq(schema.departments.id, outsideDepartmentId));

    await getDb().insert(schema.departments).values({
      id: outsideDepartmentId,
      code: "SEC-DEPT",
      name: "Security Department",
      createdBy: seedIds.users.bootstrapAdmin,
    });

    await expect(
      listDepartmentMembersForActor(head, outsideDepartmentId),
    ).rejects.toThrow("You do not have access to this department.");
  });

  it("rejects stale project versions without mutating the row", async () => {
    const head = await getProjectActor(seedIds.users.departmentHead);
    const [current] = await getDb()
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, seedIds.projects.transformation))
      .limit(1);

    expect(current).toBeDefined();
    if (!current) {
      throw new Error("Seed project is required for optimistic conflict test.");
    }

    await expect(
      updateProject(head, {
        projectId: current.id,
        version: current.version + 1,
        title: "Should not persist",
        description: current.description ?? undefined,
        status: current.status,
        startDate: current.startDate?.toISOString().slice(0, 10),
        endDate: current.endDate?.toISOString().slice(0, 10),
      }),
    ).rejects.toThrow(
      "Project was updated by another session. Refresh and try again.",
    );

    const [after] = await getDb()
      .select({
        title: schema.projects.title,
        version: schema.projects.version,
      })
      .from(schema.projects)
      .where(eq(schema.projects.id, seedIds.projects.transformation))
      .limit(1);

    expect(after).toEqual({
      title: current.title,
      version: current.version,
    });
  });

  it("rolls back writes when a transaction fails", async () => {
    const departmentId = "90000000-0000-4000-8000-000000000012";

    await getDb()
      .delete(schema.departments)
      .where(eq(schema.departments.id, departmentId));

    await expect(
      inTransaction(async (tx) => {
        await tx.insert(schema.departments).values({
          id: departmentId,
          code: "ROLLBACK-12",
          name: "Rollback Prompt 12",
          createdBy: seedIds.users.bootstrapAdmin,
        });

        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");

    const rows = await getDb()
      .select({ id: schema.departments.id })
      .from(schema.departments)
      .where(eq(schema.departments.id, departmentId));

    expect(rows).toEqual([]);
  });
});
