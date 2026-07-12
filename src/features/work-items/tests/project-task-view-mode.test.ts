import { describe, expect, it } from "vitest";

import {
  projectTaskViewModes,
  resolveProjectTaskViewMode,
} from "../ui/project-task-view-mode";

describe("project task view mode", () => {
  it("accepts supported project task views", () => {
    expect(projectTaskViewModes).toEqual(["list", "kanban", "gantt"]);
    expect(resolveProjectTaskViewMode("kanban")).toBe("kanban");
    expect(resolveProjectTaskViewMode("gantt")).toBe("gantt");
  });

  it("falls back to list for missing or unsupported values", () => {
    expect(resolveProjectTaskViewMode(undefined)).toBe("list");
    expect(resolveProjectTaskViewMode("calendar")).toBe("list");
  });
});
