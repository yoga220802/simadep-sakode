import type {
  ChartDataPoint,
  EmployeeData,
  ProjectData,
  TaskData,
} from "@/src/types/dashboard";
import type { ProjectReportData } from "@/src/types/report";

import type {
  ReportProjectStatus,
  ReportTaskStatus,
  StatusCounts,
} from "./metrics";

export type DashboardScope = "system" | "department" | "user";

export type ReportingDashboardData = {
  scope: DashboardScope;
  title: string;
  subtitle: string;
  roleCounts: {
    super_admin: number;
    admin: number;
    user: number;
    total: number;
  };
  projectStatusCounts: StatusCounts<ReportProjectStatus>;
  taskStatusCounts: StatusCounts<ReportTaskStatus>;
  completionRate: number;
  averageCompletionDays: number;
  employees: EmployeeData[];
  projects: ProjectData[];
  tasks: TaskData[];
  chartData: ChartDataPoint[];
  performanceNotes: string[];
};

export type ProjectReportResult = {
  projectId: string;
  projectTitle: string;
  report: ProjectReportData;
  milestones: Array<{
    id: string;
    title: string;
  }>;
  performanceNotes: string[];
};
