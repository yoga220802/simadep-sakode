"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { ChevronDown } from "lucide-react";
import type { Selection } from "@react-types/shared";

import {
  AssigneeChart,
  EstimationChart,
  PriorityChart,
  TotalTasksPieChart,
  WeeklyActivityChart,
} from "@/src/components/projects/report/ReportCharts";
import type { ProjectReportResult } from "../application";
import type { TaskEstimation } from "@/src/types/report";

function ChartCard({
  title,
  children,
  extraHeaderContent,
}: {
  title: string;
  children: React.ReactNode;
  extraHeaderContent?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-[var(--color-text-main)]">
          {title}
        </h3>
        {extraHeaderContent}
      </div>
      {children}
    </div>
  );
}

function ReportStat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--color-text-main)]">
        {value}
      </p>
    </div>
  );
}

export function ProjectReportPanel({ report }: { report: ProjectReportResult }) {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("all");
  const reportData = report.report;

  const filteredEstimationData = useMemo((): TaskEstimation[] => {
    if (selectedMilestoneId === "all") {
      return reportData.taskEstimation;
    }

    return reportData.taskEstimation.filter(
      (task) => task.milestone_id === selectedMilestoneId,
    );
  }, [reportData.taskEstimation, selectedMilestoneId]);

  const milestoneOptions = useMemo(
    () => [{ id: "all", title: "Semua Milestone" }, ...report.milestones],
    [report.milestones],
  );
  const selectedMilestoneName =
    milestoneOptions.find((milestone) => milestone.id === selectedMilestoneId)?.title ??
    "Semua Milestone";

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[var(--color-text-main)]">
          Laporan Project
        </h2>
        <p className="text-sm text-gray-500">
          Metrik status, assignee, prioritas, aktivitas, dan durasi selesai.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ReportStat title="Tugas Selesai" value={reportData.summary.tasksCompleted} />
        <ReportStat
          title="Tugas Belum Selesai"
          value={reportData.summary.tasksInProgress}
        />
        <ReportStat title="Total Tugas" value={reportData.summary.totalTasks} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <ChartCard title="Penerima Tugas">
            <AssigneeChart data={reportData.assigneePerformance} />
          </ChartCard>
          <ChartCard title="Aktivitas Mingguan">
            <WeeklyActivityChart data={reportData.weeklyActivity} />
          </ChartCard>
        </div>
        <div className="space-y-5">
          <ChartCard title="Total Tugas">
            <TotalTasksPieChart
              completed={reportData.summary.tasksCompleted}
              inProgress={reportData.summary.tasksInProgress}
            />
          </ChartCard>
          <ChartCard title="Prioritas Tugas">
            <PriorityChart data={reportData.priorityDistribution} />
          </ChartCard>
        </div>
      </div>

      {reportData.taskEstimation.length > 0 && (
        <ChartCard
          title="Estimasi dan Realisasi Waktu"
          extraHeaderContent={
            <Dropdown>
              <DropdownTrigger>
                <Button variant="bordered" endContent={<ChevronDown size={16} />}>
                  {selectedMilestoneName}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Filter Milestone"
                selectionMode="single"
                selectedKeys={[selectedMilestoneId]}
                items={milestoneOptions}
                onSelectionChange={(keys: Selection) => {
                  const key = Array.from(keys)[0];
                  setSelectedMilestoneId(String(key));
                }}
              >
                {(item) => <DropdownItem key={item.id}>{item.title}</DropdownItem>}
              </DropdownMenu>
            </Dropdown>
          }
        >
          <EstimationChart data={filteredEstimationData} />
        </ChartCard>
      )}

    </section>
  );
}
