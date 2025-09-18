import type { ReactNode } from "react";
import type {
	EmployeeData,
	ProjectData,
	TaskData,
	ChartDataPoint,
} from "@/src/types/dashboard";
import type { StatusTask } from "@/src/types/task";
import ProjectSummaryChart from "../components/dashboard/ProjectSummaryChart";
import InfoTable, {
	ColumnConfig,
	AvatarCell,
	RoleBadge,
	PriorityBadge,
} from "../components/dashboard/InfoTable";
import { Circle, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

// --- Komponen & Helper untuk Dashboard ---

// 1. Helper untuk Progress Bar PM
const ProjectProgress = ({ item }: { item: ProjectData }) => {
	const progress =
		item.totalTasks > 0 ? (item.tasksCompleted / item.totalTasks) * 100 : 0;

	// Logika warna dinamis
	let progressBarColor = "bg-green-500"; // Default hijau
	if (progress < 25) {
		progressBarColor = "bg-red-500";
	} else if (progress < 75) {
		progressBarColor = "bg-yellow-500";
	}

	return (
		<div className='flex items-center gap-3'>
			<div className='w-full max-w-[100px] bg-gray-200 rounded-full h-2'>
				<div
					className={`${progressBarColor} h-2 rounded-full transition-all duration-500`}
					style={{ width: `${progress}%` }}
				/>
			</div>
			<span className='text-sm font-medium text-gray-600 whitespace-nowrap'>
				{item.tasksCompleted} / {item.totalTasks}
			</span>
		</div>
	);
};

// 2. Helper untuk Status Badge Team Member
const statusConfig: Record<
	StatusTask,
	{ label: string; icon: React.ReactNode; color: string }
> = {
	pending: {
		label: "Pending",
		icon: <Circle size={16} />,
		color: "text-gray-600 bg-gray-100",
	},
	in_progress: {
		label: "In Progress",
		icon: <MinusCircle size={16} />,
		color: "text-blue-600 bg-blue-100",
	},
	completed: {
		label: "Completed",
		icon: <CheckCircle2 size={16} />,
		color: "text-green-600 bg-green-100",
	},
	cancelled: {
		label: "Cancelled",
		icon: <XCircle size={16} />,
		color: "text-red-600 bg-red-100",
	},
};

const TaskStatusBadge = ({ status }: { status: string | null }) => {
	const config = statusConfig[status as StatusTask] || statusConfig.pending;
	return (
		<span
			className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${config.color}`}>
			{config.icon}
			{config.label}
		</span>
	);
};

// Konfigurasi kolom untuk setiap tipe data
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
	{
		key: "status",
		header: "STATUS",
		render: (item) => <TaskStatusBadge status={item.status} />,
	},
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
