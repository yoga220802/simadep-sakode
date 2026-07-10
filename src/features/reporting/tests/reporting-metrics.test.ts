import { describe, expect, it } from "vitest";

import {
  averageMinutes,
  completionRate,
  countByStatus,
  minutesToReportDays,
  reportTaskStatuses,
} from "@/src/features/reporting";

describe("reporting metrics", () => {
  it("counts status totals consistently", () => {
    const counts = countByStatus(
      [
        { status: "pending" as const },
        { status: "completed" as const },
        { status: "completed" as const },
      ],
      reportTaskStatuses,
    );

    expect(counts.total).toBe(3);
    expect(counts.pending).toBe(1);
    expect(counts.completed).toBe(2);
    expect(counts.in_progress).toBe(0);
    expect(counts.cancelled).toBe(0);
  });

  it("calculates completion rate and duration in 24-hour days", () => {
    expect(completionRate({ completed: 3, total: 4 })).toBe(75);
    expect(completionRate({ completed: 0, total: 0 })).toBe(0);
    expect(minutesToReportDays(2880)).toBe(2);
    expect(averageMinutes([60, null, 180])).toBe(120);
  });
});
