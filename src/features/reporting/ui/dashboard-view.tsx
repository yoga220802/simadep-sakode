import Link from "next/link";

import ProjectSummaryChart from "@/src/components/dashboard/ProjectSummaryChart";
import StatCard from "@/src/components/dashboard/StatCard";
import type { AuditActivityItem } from "@/src/features/audit";

import type { ReportingDashboardData } from "../application";
import { buildDashboardStatCards } from "../application";
import { AuditActivityPanel } from "@/src/features/audit/ui/audit-activity-panel";

function TableShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-lg font-bold text-[var(--color-text-main)]">{title}</h2>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-5 text-center text-sm text-gray-500">
        Tidak ada data untuk ditampilkan.
      </td>
    </tr>
  );
}

export function ReportingDashboardView({
  data,
  auditItems,
}: {
  data: ReportingDashboardData;
  auditItems: AuditActivityItem[];
}) {
  const cards = buildDashboardStatCards(data);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-main)]">
          {data.title}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{data.subtitle}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-[var(--color-text-main)]">
          Ringkasan Project
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.projectStatCards.map((card) => (
            <StatCard key={card.title} data={card} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-bold text-[var(--color-text-main)]">
          Ringkasan Tugas
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.taskStatCards.map((card) => (
            <StatCard key={card.title} data={card} />
          ))}
        </div>
      </section>

      {data.scope !== "user" && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-[var(--color-text-main)]">
            Ringkasan Pegawai
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {cards.employeeStatCards.map((card) => (
              <StatCard key={card.title} data={card} />
            ))}
          </div>
        </section>
      )}

      <ProjectSummaryChart data={data.chartData} />

      <div className="grid gap-5 xl:grid-cols-2">
        <TableShell title="Project Mendekati Tenggat">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Progress</th>
                <th className="px-5 py-3">Tenggat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.projects.length === 0 ? (
                <EmptyRow colSpan={3} />
              ) : (
                data.projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-5 py-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-semibold text-[var(--color-primary)]"
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {project.tasksCompleted}/{project.totalTasks}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{project.dueDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableShell>

        <TableShell title="Tugas Mendatang">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Tugas</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Tenggat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.tasks.length === 0 ? (
                <EmptyRow colSpan={3} />
              ) : (
                data.tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {task.taskName}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{task.status}</td>
                    <td className="px-5 py-3 text-gray-600">{task.dueDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableShell>
      </div>

      {data.scope !== "user" && (
        <TableShell title="Pegawai Dalam Scope">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">Nama</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.employees.length === 0 ? (
                <EmptyRow colSpan={3} />
              ) : (
                data.employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {employee.name}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{employee.email}</td>
                    <td className="px-5 py-3 text-gray-600">{employee.role}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableShell>
      )}

      <AuditActivityPanel items={auditItems} />
    </div>
  );
}
