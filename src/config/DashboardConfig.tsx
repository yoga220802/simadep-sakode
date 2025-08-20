import type { ReactNode } from "react";
import type {
	EmployeeData,
	ClientData,
	ProjectData,
	TaskData,
	ChartDataPoint,
} from "@/src/types/dashboard";
import ProjectSummaryChart from "../components/dashboard/ProjectSummaryChart";
import InfoTable, { ColumnConfig, AvatarCell, RoleBadge, PriorityBadge } from "../components/dashboard/InfoTable";

// Konfigurasi kolom untuk setiap tipe data
const employeeColumns: ColumnConfig<EmployeeData>[] = [
	{ key: "index", header: "NO" },
	{
		key: "avatarUrl",
		header: "FOTO",
		render: (item) => <AvatarCell src={item.avatarUrl} alt={item.name} />,
	},
	{ key: "name", header: "NAMA" },
	{ key: "position", header: "JABATAN" },
	{ key: "email", header: "EMAIL" },
	{
		key: "role",
		header: "ROLE",
		render: (item) => <RoleBadge role={item.role} />,
	},
];

const clientColumns: ColumnConfig<ClientData>[] = [
	{ key: "index", header: "NO" },
	{ key: "name", header: "NAMA" },
	{ key: "email", header: "EMAIL" },
	{
		key: "projects",
		header: "PROYEK",
		render: (item) => item.projects.join(", "),
	},
	{
		key: "role",
		header: "ROLE",
		render: (item) => <RoleBadge role={item.role} />,
	},
];

const projectColumns: ColumnConfig<ProjectData>[] = [
	{ key: "name", header: "NAMA PROYEK" },
	{ key: "taskCount", header: "JUMLAH TUGAS" },
	{ key: "dueDate", header: "TENGGAT WAKTU" },
];

const taskColumns: ColumnConfig<TaskData>[] = [
	{ key: "taskName", header: "NAMA TUGAS" },
	{ key: "projectName", header: "PROYEK" },
	{ key: "dueDate", header: "TENGGAT WAKTU" },
	{
		key: "priority",
		header: "PRIORITAS",
		render: (item) => <PriorityBadge priority={item.priority} />,
	},
];

// Tipe untuk data yang diterima oleh komponen
type DashboardData = {
	employees?: EmployeeData[];
	clients?: ClientData[];
	projects?: ProjectData[];
	tasks?: TaskData[];
	chartData?: ChartDataPoint[]; // FIX: Menggunakan ChartDataPoint[] bukan any[]
};

// Konfigurasi komponen untuk setiap role
export const dashboardConfig: Record<
	"Admin" | "Project Manager" | "Team Member",
	{
		components: ((data: DashboardData) => ReactNode)[];
	}
> = {
	Admin: {
		components: [
			(data) =>
				data.employees && (
					<InfoTable
						title='Pegawai'
						items={data.employees}
						columns={employeeColumns}
					/>
				),
			(data) =>
				data.clients && (
					<InfoTable title='Client' items={data.clients} columns={clientColumns} />
				),
		],
	},
	"Project Manager": {
		components: [
			(data) => data.chartData && <ProjectSummaryChart data={data.chartData} />,
			(data) =>
				data.projects && (
					<InfoTable title='Proyek' items={data.projects} columns={projectColumns} />
				),
		],
	},
	"Team Member": {
		components: [
			(data) =>
				data.tasks && (
					<InfoTable
						title='Tugas Mendatang'
						items={data.tasks}
						columns={taskColumns}
					/>
				),
		],
	},
};
