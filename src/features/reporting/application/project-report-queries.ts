import "@/src/infrastructure/server-only";

import { asc, eq, inArray } from "drizzle-orm";

import { getDb, schema } from "@/src/infrastructure/db";
import {
  canViewProjectReport,
  getProjectDetailForActor,
  type ProjectActor,
} from "@/src/features/projects";

import type { ProjectReportResult } from "./contracts";
import { minutesToReportDays } from "./metrics";

type ReportTaskRow = {
  id: string;
  milestoneId: string;
  name: string;
  status: string;
  priority: "low" | "medium" | "high" | null;
  estimatedDurationMinutes: number | null;
  finishedDurationMinutes: number | null;
  createdAt: Date;
  completedAt: Date | null;
};

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function buildWeeklyActivity(tasks: ReportTaskRow[]) {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = dayKey(date);
    const createdToday = tasks.filter((task) => dayKey(task.createdAt) === key).length;
    const completedToday = tasks.filter(
      (task) => task.completedAt && dayKey(task.completedAt) === key,
    ).length;

    return {
      date: dayLabel(date),
      selesai: completedToday,
      total: createdToday + completedToday,
    };
  });
}

export async function getProjectReportForActor(
  actor: ProjectActor,
  projectId: string,
): Promise<ProjectReportResult> {
  const project = await getProjectDetailForActor(actor, projectId);
  if (!canViewProjectReport(actor, project)) {
    throw new Error("You cannot view this project report.");
  }

  const [tasks, milestones] = await Promise.all([
    getDb()
      .select({
        id: schema.tasks.id,
        milestoneId: schema.tasks.milestoneId,
        name: schema.tasks.name,
        status: schema.tasks.status,
        priority: schema.tasks.priority,
        estimatedDurationMinutes: schema.tasks.estimatedDurationMinutes,
        finishedDurationMinutes: schema.tasks.finishedDurationMinutes,
        createdAt: schema.tasks.createdAt,
        completedAt: schema.tasks.completedAt,
      })
      .from(schema.tasks)
      .where(eq(schema.tasks.projectId, projectId))
      .orderBy(asc(schema.tasks.displayOrder), asc(schema.tasks.createdAt)),
    getDb()
      .select({
        id: schema.milestones.id,
        title: schema.milestones.title,
      })
      .from(schema.milestones)
      .where(eq(schema.milestones.projectId, projectId))
      .orderBy(schema.milestones.displayOrder),
  ]);

  const taskIds = tasks.map((task) => task.id);
  const assignees =
    taskIds.length === 0
      ? []
      : await getDb()
          .select({
            taskId: schema.taskAssignees.taskId,
            userId: schema.taskAssignees.userId,
            name: schema.user.name,
            email: schema.user.email,
            image: schema.user.image,
            displayName: schema.userProfiles.displayName,
            avatarUrl: schema.userProfiles.avatarUrl,
            status: schema.tasks.status,
          })
          .from(schema.taskAssignees)
          .innerJoin(schema.tasks, eq(schema.tasks.id, schema.taskAssignees.taskId))
          .innerJoin(schema.user, eq(schema.user.id, schema.taskAssignees.userId))
          .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.user.id))
          .where(inArray(schema.taskAssignees.taskId, taskIds));

  const assigneeByUser = new Map<
    string,
    {
      assignee: { user_id: string; name: string; avatarUrl?: string };
      selesai: number;
      inProgress: number;
    }
  >();

  for (const assignee of assignees) {
    const item =
      assigneeByUser.get(assignee.userId) ??
      {
        assignee: {
          user_id: assignee.userId,
          name: assignee.displayName ?? assignee.name ?? assignee.email,
          avatarUrl: assignee.avatarUrl ?? assignee.image ?? undefined,
        },
        selesai: 0,
        inProgress: 0,
      };

    if (assignee.status === "completed") {
      item.selesai += 1;
    } else {
      item.inProgress += 1;
    }

    assigneeByUser.set(assignee.userId, item);
  }

  const completed = tasks.filter((task) => task.status === "completed").length;
  const incomplete = tasks.length - completed;
  const priorityCounts = tasks.reduce(
    (acc, task) => {
      if (task.priority) {
        acc[task.priority] += 1;
      }
      return acc;
    },
    { low: 0, medium: 0, high: 0 },
  );

  return {
    projectId,
    projectTitle: project.title,
    milestones,
    report: {
      summary: {
        tasksCompleted: completed,
        tasksInProgress: incomplete,
        totalTasks: tasks.length,
      },
      assigneePerformance: [...assigneeByUser.values()],
      priorityDistribution: [
        { name: "Tinggi", value: priorityCounts.high },
        { name: "Sedang", value: priorityCounts.medium },
        { name: "Rendah", value: priorityCounts.low },
      ],
      weeklyActivity: buildWeeklyActivity(tasks),
      taskEstimation: tasks.map((task) => ({
        name: task.name,
        estimasi: minutesToReportDays(task.estimatedDurationMinutes),
        selesai: minutesToReportDays(task.finishedDurationMinutes),
        milestone_id: task.milestoneId,
      })),
    },
    performanceNotes: [
      "Project report validates project visibility before loading report data.",
      "Tasks, milestones, assignees, users, and profiles are loaded in batched joins.",
      "Completion duration uses finishedDurationMinutes converted to 24-hour days.",
    ],
  };
}
