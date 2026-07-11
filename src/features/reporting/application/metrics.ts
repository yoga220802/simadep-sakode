export const reportProjectStatuses = [
  "tender",
  "active",
  "completed",
  "cancelled",
] as const;

export const reportTaskStatuses = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type ReportProjectStatus = (typeof reportProjectStatuses)[number];
export type ReportTaskStatus = (typeof reportTaskStatuses)[number];

export type StatusCounts<T extends string> = Record<T, number> & { total: number };

export function createStatusCounts<T extends string>(
  statuses: readonly T[],
): StatusCounts<T> {
  return statuses.reduce(
    (acc, status) => {
      acc[status] = 0 as StatusCounts<T>[T];
      return acc;
    },
    { total: 0 } as StatusCounts<T>,
  );
}

export function countByStatus<T extends string>(
  rows: Array<{ status: string }>,
  statuses: readonly T[],
): StatusCounts<T> {
  const counts = createStatusCounts(statuses);

  for (const row of rows) {
    counts.total += 1;
    if (statuses.includes(row.status as T)) {
      const status = row.status as T;
      counts[status] = (counts[status] + 1) as StatusCounts<T>[T];
    }
  }

  return counts;
}

export function completionRate(input: { completed: number; total: number }) {
  if (input.total <= 0) {
    return 0;
  }

  return Math.round((input.completed / input.total) * 100);
}

export function minutesToReportDays(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) {
    return 0;
  }

  return Number((minutes / 60 / 24).toFixed(1));
}

export function averageMinutes(values: Array<number | null | undefined>) {
  const normalized = values.filter(
    (value): value is number => typeof value === "number" && value > 0,
  );

  if (normalized.length === 0) {
    return 0;
  }

  return Math.round(
    normalized.reduce((total, value) => total + value, 0) / normalized.length,
  );
}
