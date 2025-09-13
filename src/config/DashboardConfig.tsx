import type { ReactNode } from "react";
import type {
	EmployeeData,
	ProjectData,
	TaskData,
	ChartDataPoint,
} from "@/src/types/dashboard";
import ProjectSummaryChart from "../components/dashboard/ProjectSummaryChart";
import InfoTable, {
	ColumnConfig,
	AvatarCell,
	RoleBadge,
	PriorityBadge,
} from "../components/dashboard/InfoTable";

// Konfigurasi kolom untuk setiap tipe data

const ProjectProgress = ({ item }: { item: ProjectData }) => {
	const progress =
		item.totalTasks > 0 ? (item.tasksCompleted / item.totalTasks) * 100 : 0;
	return (
		<div className='flex items-center gap-3'>
			<div className='w-full max-w-[100px] bg-gray-200 rounded-full h-2'>
				<div
					className='bg-green-500 h-2 rounded-full'
					style={{ width: `${progress}%` }}
				/>
			</div>
			<span className='text-sm font-medium text-gray-600 whitespace-nowrap'>
				{item.tasksCompleted} / {item.totalTasks}
			</span>
		</div>
	);
};

const employeeColumns: ColumnConfig<EmployeeData>[] = [
	{ key: "index", header: "NO" },
	{
		key: "profile_url",
		header: "FOTO",
		render: (item) => <AvatarCell src={item.profile_url} alt={item.name} />,
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

const projectColumns: ColumnConfig<ProjectData>[] = [
	{ key: "name", header: "NAMA PROYEK" },
	{
		key: "totalTasks", // Menggunakan key yang ada di data untuk re-render
		header: "PROGRESS TUGAS",
		render: (item) => <ProjectProgress item={item} />,
	},
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
	projects?: ProjectData[];
	tasks?: TaskData[];
	chartData?: ChartDataPoint[];
};

// Tipe untuk kunci role yang valid di config
export type DashboardRole = "Admin" | "Project Manager" | "Team Member";

// Konfigurasi komponen untuk setiap role
export const dashboardConfig: Record<
	DashboardRole,
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
		],
	},
	"Project Manager": {
		components: [
			(data) => data.chartData && <ProjectSummaryChart data={data.chartData} />,
			(data) =>
				data.projects && (
					<InfoTable
						title='Proyek Mendekati Tenggat'
						items={data.projects}
						columns={projectColumns}
					/>
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
