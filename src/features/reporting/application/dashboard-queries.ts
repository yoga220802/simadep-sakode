import "@/src/infrastructure/server-only";

import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import {
  CheckCircle,
  CircleArrowOutDownLeft,
  ClipboardList,
  FolderKanban,
  ListTodo,
  Shield,
  UserCheck,
  Users,
} from "lucide-react";

import { getDb, schema } from "@/src/infrastructure/db";
import {
  isGlobalProjectAdmin,
  type ProjectActor,
} from "@/src/features/projects";
import type { StatCardData } from "@/src/types/dashboard";

import type { ReportingDashboardData } from "./contracts";
import {
  averageMinutes,
  completionRate,
  countByStatus,
  minutesToReportDays,
  reportProjectStatuses,
  reportTaskStatuses,
} from "./metrics";

type ProjectRow = {
  id: string;
  title: string;
  status: "tender" | "active" | "completed" | "cancelled";
  departmentId: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
};

type TaskRow = {
  id: string;
  projectId: string;
  projectTitle: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | null;
  dueDate: Date | null;
  finishedDurationMinutes: number | null;
  createdAt: Date;
  completedAt: Date | null;
};

function activeDepartmentIds(actor: ProjectActor) {
  return actor.departmentMemberships
    .filter((membership) => membership.status === "active")
    .map((membership) => membership.departmentId);
}

function scopedProjectClause(actor: ProjectActor) {
  if (isGlobalProjectAdmin(actor.globalRole)) {
    return undefined;
  }

  const projectIds = actor.projectMemberships.map((membership) => membership.projectId);
  const departmentIds = activeDepartmentIds(actor);

  return or(
    projectIds.length ? inArray(schema.projects.id, projectIds) : undefined,
    departmentIds.length ? inArray(schema.projects.departmentId, departmentIds) : undefined,
  );
}

function dashboardScope(actor: ProjectActor): ReportingDashboardData["scope"] {
  if (isGlobalProjectAdmin(actor.globalRole)) {
    return "system";
  }

  const departmentRole = actor.departmentMemberships.find(
    (membership) =>
      membership.status === "active" &&
      (membership.role === "head" || membership.role === "department_admin"),
  );

  return departmentRole ? "department" : "user";
}

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function monthLabel(index: number) {
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
    new Date(Date.UTC(2026, index, 1)),
  );
}

function buildMonthlyChart(projects: ProjectRow[]) {
  return Array.from({ length: 12 }, (_, month) => {
    const created = projects.filter(
      (project) => project.createdAt.getUTCMonth() === month,
    );

    return {
      month: monthLabel(month),
      masuk: created.length,
      berjalan: created.filter((project) => project.status === "active").length,
      selesai: created.filter((project) => project.status === "completed").length,
    };
  });
}

function buildProjectRows(projects: ProjectRow[], tasks: TaskRow[]) {
  return projects
    .filter((project) => project.endDate)
    .sort((a, b) => (a.endDate?.getTime() ?? 0) - (b.endDate?.getTime() ?? 0))
    .slice(0, 5)
    .map((project) => {
      const projectTasks = tasks.filter((task) => task.projectId === project.id);
      const completed = projectTasks.filter((task) => task.status === "completed").length;

      return {
        id: project.id,
        name: project.title,
        totalTasks: projectTasks.length,
        tasksCompleted: completed,
        task_count: projectTasks.length,
        task_in_progress: projectTasks.filter((task) => task.status === "in_progress")
          .length,
        startDate: formatDate(project.startDate),
        dueDate: formatDate(project.endDate),
      };
    });
}

function buildUpcomingTasks(tasks: TaskRow[]) {
  return tasks
    .filter((task) => task.dueDate && task.status !== "completed")
    .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0))
    .slice(0, 8)
    .map((task) => ({
      id: task.id,
      taskName: task.name,
      status: task.status,
      dueDate: formatDate(task.dueDate),
      priority: task.priority ?? "medium",
    }));
}

async function listScopedProjects(actor: ProjectActor): Promise<ProjectRow[]> {
  if (!isGlobalProjectAdmin(actor.globalRole)) {
    const hasScope =
      actor.projectMemberships.length > 0 || activeDepartmentIds(actor).length > 0;

    if (!hasScope) {
      return [];
    }
  }

  return getDb()
    .select({
      id: schema.projects.id,
      title: schema.projects.title,
      status: schema.projects.status,
      departmentId: schema.projects.departmentId,
      startDate: schema.projects.startDate,
      endDate: schema.projects.endDate,
      createdAt: schema.projects.createdAt,
    })
    .from(schema.projects)
    .where(and(isNull(schema.projects.deletedAt), scopedProjectClause(actor)))
    .orderBy(desc(schema.projects.updatedAt));
}

async function listTasksForProjects(projectIds: string[]): Promise<TaskRow[]> {
  if (projectIds.length === 0) {
    return [];
  }

  return getDb()
    .select({
      id: schema.tasks.id,
      projectId: schema.tasks.projectId,
      projectTitle: schema.projects.title,
      name: schema.tasks.name,
      status: schema.tasks.status,
      priority: schema.tasks.priority,
      dueDate: schema.tasks.dueDate,
      finishedDurationMinutes: schema.tasks.finishedDurationMinutes,
      createdAt: schema.tasks.createdAt,
      completedAt: schema.tasks.completedAt,
    })
    .from(schema.tasks)
    .innerJoin(schema.projects, eq(schema.projects.id, schema.tasks.projectId))
    .where(inArray(schema.tasks.projectId, projectIds))
    .orderBy(asc(schema.tasks.dueDate), asc(schema.tasks.createdAt));
}

async function listActorAssignedTaskIds(actorId: string, taskIds: string[]) {
  if (taskIds.length === 0) {
    return new Set<string>();
  }

  const rows = await getDb()
    .select({ taskId: schema.taskAssignees.taskId })
    .from(schema.taskAssignees)
    .where(
      and(
        eq(schema.taskAssignees.userId, actorId),
        inArray(schema.taskAssignees.taskId, taskIds),
      ),
    );

  return new Set(rows.map((row) => row.taskId));
}

async function listEmployeesForDashboard(actor: ProjectActor) {
  if (!isGlobalProjectAdmin(actor.globalRole)) {
    const departmentIds = activeDepartmentIds(actor);
    if (departmentIds.length === 0) {
      return [];
    }

    return getDb()
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        role: schema.user.role,
        image: schema.user.image,
        displayName: schema.userProfiles.displayName,
        position: schema.userProfiles.position,
        avatarUrl: schema.userProfiles.avatarUrl,
      })
      .from(schema.departmentMembers)
      .innerJoin(schema.user, eq(schema.user.id, schema.departmentMembers.userId))
      .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.user.id))
      .where(
        and(
          inArray(schema.departmentMembers.departmentId, departmentIds),
          eq(schema.departmentMembers.status, "active"),
        ),
      )
      .orderBy(schema.user.name)
      .limit(8);
  }

  return getDb()
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.user.role,
      image: schema.user.image,
      displayName: schema.userProfiles.displayName,
      position: schema.userProfiles.position,
      avatarUrl: schema.userProfiles.avatarUrl,
    })
    .from(schema.user)
    .leftJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.user.id))
    .where(eq(schema.user.banned, false))
    .orderBy(schema.user.name)
    .limit(8);
}

async function getRoleCounts() {
  const rows = await getDb()
    .select({ role: schema.user.role })
    .from(schema.user)
    .where(eq(schema.user.banned, false));

  return rows.reduce(
    (acc, row) => {
      if (row.role === "super_admin") {
        acc.super_admin += 1;
      } else if (row.role === "admin") {
        acc.admin += 1;
      } else {
        acc.user += 1;
      }
      acc.total += 1;
      return acc;
    },
    { super_admin: 0, admin: 0, user: 0, total: 0 },
  );
}

function displayRole(role: string): "Admin" | "Project Manager" | "Team Member" | "Viewer" {
  if (role === "super_admin" || role === "admin") {
    return "Admin";
  }

  return "Team Member";
}

export async function getDashboardForActor(
  actor: ProjectActor,
): Promise<ReportingDashboardData> {
  const scope = dashboardScope(actor);
  const [projects, employees, roleCounts] = await Promise.all([
    listScopedProjects(actor),
    listEmployeesForDashboard(actor),
    getRoleCounts(),
  ]);
  const projectIds = projects.map((project) => project.id);
  const tasks = await listTasksForProjects(projectIds);
  const userAssignedTaskIds =
    scope === "user"
      ? await listActorAssignedTaskIds(actor.id, tasks.map((task) => task.id))
      : null;
  const scopedTasks =
    userAssignedTaskIds == null
      ? tasks
      : tasks.filter((task) => userAssignedTaskIds.has(task.id));
  const projectStatusCounts = countByStatus(projects, reportProjectStatuses);
  const taskStatusCounts = countByStatus(scopedTasks, reportTaskStatuses);
  const completed = taskStatusCounts.completed;

  return {
    scope,
    title:
      scope === "system"
        ? "Dashboard Sistem"
        : scope === "department"
          ? "Dashboard Departemen"
          : "Dashboard Saya",
    subtitle:
      scope === "system"
        ? "Ringkasan seluruh project, tugas, pegawai, dan aktivitas SIMADEP."
        : scope === "department"
          ? "Ringkasan project dan tugas dalam departemen yang dapat Anda akses."
          : "Ringkasan project dan tugas yang dapat Anda akses.",
    roleCounts,
    projectStatusCounts,
    taskStatusCounts,
    completionRate: completionRate({ completed, total: taskStatusCounts.total }),
    averageCompletionDays: minutesToReportDays(
      averageMinutes(scopedTasks.map((task) => task.finishedDurationMinutes)),
    ),
    employees: employees.map((employee) => ({
      id: employee.id,
      name: employee.displayName ?? employee.name,
      profile_url:
        employee.avatarUrl ??
        employee.image ??
        `https://placehold.co/40x40/E4E7EC/667085?text=${encodeURIComponent(
          (employee.displayName ?? employee.name).charAt(0).toUpperCase(),
        )}`,
      position: employee.position ?? "-",
      email: employee.email,
      role: displayRole(employee.role),
    })),
    projects: buildProjectRows(projects, tasks),
    tasks: buildUpcomingTasks(scopedTasks),
    chartData: buildMonthlyChart(projects),
    performanceNotes: [
      "Dashboard reads visible projects in one scoped query, then batches task and profile reads.",
      "Completion rate is completed tasks divided by all visible tasks.",
      "Average completion duration uses finishedDurationMinutes and reports 24-hour days.",
    ],
  };
}

export function buildDashboardStatCards(
  data: ReportingDashboardData,
): {
  employeeStatCards: StatCardData[];
  projectStatCards: StatCardData[];
  taskStatCards: StatCardData[];
} {
  return {
    employeeStatCards: [
      { title: "Total Pegawai", value: data.roleCounts.total, icon: Users },
      { title: "Admin", value: data.roleCounts.admin + data.roleCounts.super_admin, icon: Shield },
      { title: "User Aktif", value: data.roleCounts.user, icon: UserCheck },
    ],
    projectStatCards: [
      { title: "Total Project", value: data.projectStatusCounts.total, icon: FolderKanban },
      { title: "Project Aktif", value: data.projectStatusCounts.active, icon: ClipboardList },
      { title: "Project Selesai", value: data.projectStatusCounts.completed, icon: CheckCircle },
      {
        title: "Project Tender",
        value: data.projectStatusCounts.tender,
        icon: CircleArrowOutDownLeft,
      },
    ],
    taskStatCards: [
      { title: "Total Tugas", value: data.taskStatusCounts.total, icon: ListTodo },
      { title: "Tugas Berjalan", value: data.taskStatusCounts.in_progress, icon: ClipboardList },
      { title: "Tugas Selesai", value: data.taskStatusCounts.completed, icon: CheckCircle },
      { title: "Completion Rate", value: `${data.completionRate}%`, icon: CheckCircle },
    ],
  };
}
