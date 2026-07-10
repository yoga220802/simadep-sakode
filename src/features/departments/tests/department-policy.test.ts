import { describe, expect, it } from "vitest";

import {
  assertCanCreateDepartment,
  assertCanManageDepartment,
  assertCanManageDepartmentMembers,
  assertCanViewDepartment,
  assertDoesNotOrphanLastHead,
  canManageDepartment,
  type DepartmentActor,
} from "../domain/department-policy";

const memberActor: DepartmentActor = {
  id: "00000000-0000-4000-8000-000000000001",
  globalRole: "user",
  memberships: [
    {
      departmentId: "10000000-0000-4000-8000-000000000001",
      role: "member",
      status: "active",
    },
  ],
};

const headActor: DepartmentActor = {
  id: "00000000-0000-4000-8000-000000000002",
  globalRole: "user",
  memberships: [
    {
      departmentId: "10000000-0000-4000-8000-000000000001",
      role: "head",
      status: "active",
    },
  ],
};

const adminActor: DepartmentActor = {
  id: "00000000-0000-4000-8000-000000000003",
  globalRole: "admin",
  memberships: [],
};

describe("department policy denied paths", () => {
  it("blocks non-global users from creating departments", () => {
    expect(() => assertCanCreateDepartment(memberActor)).toThrow(
      "Only global admins can create departments.",
    );
    expect(() => assertCanCreateDepartment(adminActor)).not.toThrow();
  });

  it("blocks out-of-scope department reads", () => {
    expect(() =>
      assertCanViewDepartment(
        memberActor,
        "10000000-0000-4000-8000-000000000099",
      ),
    ).toThrow("You do not have access to this department.");
  });

  it("allows only head, department admin, or global admin to manage", () => {
    expect(canManageDepartment(memberActor, memberActor.memberships[0].departmentId)).toBe(
      false,
    );
    expect(() =>
      assertCanManageDepartment(memberActor, memberActor.memberships[0].departmentId),
    ).toThrow("You cannot manage this department.");
    expect(() =>
      assertCanManageDepartment(headActor, headActor.memberships[0].departmentId),
    ).not.toThrow();
    expect(() =>
      assertCanManageDepartmentMembers(adminActor, "any-department-id"),
    ).not.toThrow();
  });

  it("prevents orphaning the last active department head", () => {
    expect(() =>
      assertDoesNotOrphanLastHead({
        targetRole: "head",
        nextRole: "member",
        activeHeadCount: 1,
      }),
    ).toThrow(
      "Department must keep at least one active head before member role changes.",
    );

    expect(() =>
      assertDoesNotOrphanLastHead({
        targetRole: "head",
        nextRole: "department_admin",
        activeHeadCount: 2,
      }),
    ).not.toThrow();
  });
});
