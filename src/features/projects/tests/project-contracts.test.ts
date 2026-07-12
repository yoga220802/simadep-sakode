import { describe, expect, it } from "vitest";

import {
  createProjectInputSchema,
  updateProjectInputSchema,
} from "../application/contracts";

describe("project input contracts", () => {
  it("rejects project date ranges where end date is before start date", () => {
    expect(() =>
      createProjectInputSchema.parse({
        departmentId: "10000000-0000-4000-8000-000000000001",
        title: "Project validasi tanggal",
        startDate: "2026-08-10",
        endDate: "2026-08-01",
      }),
    ).toThrow("Tanggal selesai project tidak boleh lebih awal");

    expect(() =>
      updateProjectInputSchema.parse({
        projectId: "20000000-0000-4000-8000-000000000001",
        version: 1,
        title: "Project validasi tanggal",
        status: "active",
        startDate: "2026-08-10",
        endDate: "2026-08-01",
      }),
    ).toThrow("Tanggal selesai project tidak boleh lebih awal");
  });
});
