import { describe, expect, it } from "vitest";

import {
  assertCanBanUser,
  assertCanChangeGlobalRole,
  assertCanManageUsers,
  isPrivilegedGlobalRole,
} from "./policy";

describe("identity user management policy", () => {
  it("allows privileged roles to manage users", () => {
    expect(() => assertCanManageUsers("super_admin")).not.toThrow();
    expect(() => assertCanManageUsers("admin")).not.toThrow();
    expect(() => assertCanManageUsers("user")).toThrow(
      "Only super_admin or admin can manage users.",
    );
  });

  it("prevents admin self-demotion", () => {
    expect(() =>
      assertCanChangeGlobalRole({
        actorId: "00000000-0000-4000-8000-000000000001",
        actorRole: "admin",
        targetUserId: "00000000-0000-4000-8000-000000000001",
        currentTargetRole: "admin",
        nextRole: "user",
        activePrivilegedUserCount: 2,
      }),
    ).toThrow("Admins cannot demote their own global role.");
  });

  it("prevents demoting the last active privileged admin", () => {
    expect(() =>
      assertCanChangeGlobalRole({
        actorId: "00000000-0000-4000-8000-000000000002",
        actorRole: "admin",
        targetUserId: "00000000-0000-4000-8000-000000000001",
        currentTargetRole: "super_admin",
        nextRole: "user",
        activePrivilegedUserCount: 1,
      }),
    ).toThrow("At least one active privileged admin must remain.");
  });

  it("prevents banning self or the last active privileged admin", () => {
    expect(() =>
      assertCanBanUser({
        actorId: "00000000-0000-4000-8000-000000000001",
        actorRole: "super_admin",
        targetUserId: "00000000-0000-4000-8000-000000000001",
        targetRole: "super_admin",
        activePrivilegedUserCount: 2,
      }),
    ).toThrow("Admins cannot ban their own account.");

    expect(() =>
      assertCanBanUser({
        actorId: "00000000-0000-4000-8000-000000000002",
        actorRole: "admin",
        targetUserId: "00000000-0000-4000-8000-000000000001",
        targetRole: "super_admin",
        activePrivilegedUserCount: 1,
      }),
    ).toThrow("At least one active privileged admin must remain.");
  });

  it("classifies privileged roles", () => {
    expect(isPrivilegedGlobalRole("super_admin")).toBe(true);
    expect(isPrivilegedGlobalRole("admin")).toBe(true);
    expect(isPrivilegedGlobalRole("user")).toBe(false);
  });
});
