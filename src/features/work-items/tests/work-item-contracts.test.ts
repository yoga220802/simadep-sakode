import { describe, expect, it } from "vitest";

import {
  createSubtaskInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
} from "../application/contracts";

describe("work item input contracts", () => {
  it("rejects task date ranges where due date is before start date", () => {
    expect(() =>
      createTaskInputSchema.parse({
        milestoneId: "30000000-0000-4000-8000-000000000001",
        name: "Tugas validasi tanggal",
        startDate: "2026-08-10",
        dueDate: "2026-08-01",
      }),
    ).toThrow("Tenggat tugas tidak boleh lebih awal");

    expect(() =>
      createSubtaskInputSchema.parse({
        parentTaskId: "40000000-0000-4000-8000-000000000001",
        name: "Subtask validasi tanggal",
        startDate: "2026-08-10",
        dueDate: "2026-08-01",
      }),
    ).toThrow("Tenggat tugas tidak boleh lebih awal");

    expect(() =>
      updateTaskInputSchema.parse({
        taskId: "40000000-0000-4000-8000-000000000001",
        version: 1,
        name: "Tugas validasi tanggal",
        startDate: "2026-08-10",
        dueDate: "2026-08-01",
      }),
    ).toThrow("Tenggat tugas tidak boleh lebih awal");
  });
});
