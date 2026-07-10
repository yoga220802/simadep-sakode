"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { reportService } from "@/src/services/reportService";
import { taskService } from "@/src/services/taskService";
import type { ProjectReportData, TaskEstimation } from "@/src/types/report";
import type { Milestone } from "@/src/types/task";
import {
	Button,
	Dropdown,
	DropdownItem,
	DropdownMenu,
	DropdownTrigger,
} from "@heroui/react";
import { LoaderCircle, ShieldAlert, ChevronDown } from "lucide-react";
import {
	AssigneeChart,
	PriorityChart,
	TotalTasksPieChart,
	WeeklyActivityChart,
	EstimationChart,
} from "./ReportCharts";
import type { Selection } from "@react-types/shared";

export default function ProjectReportView() {
	const params = useParams();
	const { id } = params;
	const { token } = useAuth();

	const [reportData, setReportData] = useState<ProjectReportData | null>(null);
	const [milestones, setMilestones] = useState<Milestone[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// State baru untuk filter milestone
	const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("all");

	const fetchData = useCallback(async () => {
		if (token && typeof id === "string") {
			setIsLoading(true);
			setError(null);
			try {
				// Ambil data laporan dan data milestone secara paralel
				const [report, milestoneData] = await Promise.all([
					reportService.getProjectReport(token, id),
					taskService.getMilestones(token, id),
				]);
				setReportData(report);
				setMilestones(milestoneData);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Gagal memuat data laporan.");
			} finally {
				setIsLoading(false);
			}
		}
	}, [id, token]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Memoize data estimasi yang sudah difilter
	const filteredEstimationData = useMemo((): TaskEstimation[] => {
		if (!reportData?.taskEstimation) return [];
		if (selectedMilestoneId === "all") {
			return reportData.taskEstimation;
		}
		return reportData.taskEstimation.filter(
			(task) => task.milestone_id === selectedMilestoneId
		);
	}, [reportData, selectedMilestoneId]);

	// Buat daftar opsi untuk dropdown, termasuk "Semua Milestone"
	const milestoneOptions = useMemo(() => {
		const allOption = { id: "all", title: "Semua Milestone" };
		// Pastikan tipe ID konsisten (string) agar React Aria tidak bingung
		const dynamicOptions = milestones.map((m) => ({
			id: m.id.toString(),
			title: m.title,
		}));
		return [allOption, ...dynamicOptions];
	}, [milestones]);

	const selectedMilestoneName = useMemo(() => {
		if (selectedMilestoneId === "all") return "Semua Milestone";
		return (
			milestones.find((m) => m.id.toString() === selectedMilestoneId)?.title ||
			"Semua Milestone"
		);
	}, [selectedMilestoneId, milestones]);

	if (isLoading) {
		return (
			<div className='flex justify-center items-center h-96'>
				<LoaderCircle className='w-12 h-12 animate-spin text-[var(--color-primary)]' />
			</div>
		);
	}

	if (error) {
		return (
			<div className='text-center py-10 text-red-500'>
				<ShieldAlert className='mx-auto w-12 h-12 mb-2' />
				<p>{error}</p>
			</div>
		);
	}

	if (!reportData) {
		return (
			<div className='text-center py-10 text-gray-500'>
				Tidak ada data laporan untuk ditampilkan.
			</div>
		);
	}

	const { summary, assigneePerformance, priorityDistribution, weeklyActivity } =
		reportData;

	return (
		<div className='space-y-8 pb-8'>
			{/* Stat Cards */}
			<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				<StatCard title='Tugas Selesai' value={summary.tasksCompleted} />
				<StatCard title='Tugas Belum Selesai' value={summary.tasksInProgress} />
				<StatCard title='Total Tugas' value={summary.totalTasks} />
			</div>

			{/* Charts Grid */}
			<div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
				<div className='lg:col-span-2 space-y-6'>
					<ChartCard title='Penerima Tugas'>
						<AssigneeChart data={assigneePerformance} />
					</ChartCard>
					<ChartCard title='Aktivitas Mingguan'>
						<WeeklyActivityChart data={weeklyActivity} />
					</ChartCard>
				</div>
				<div className='space-y-6'>
					<ChartCard title='Total Tugas'>
						<TotalTasksPieChart
							completed={summary.tasksCompleted}
							inProgress={summary.tasksInProgress}
						/>
					</ChartCard>
					<ChartCard title='Prioritas Tugas'>
						<PriorityChart data={priorityDistribution} />
					</ChartCard>
				</div>
			</div>

			{/* Chart Perbandingan Estimasi (jika ada datanya) */}
			{reportData.taskEstimation && reportData.taskEstimation.length > 0 && (
				<ChartCard
					title='Perbandingan Estimasi dan Realisasi Waktu'
					extraHeaderContent={
						<Dropdown>
							<DropdownTrigger>
								<Button variant='bordered' endContent={<ChevronDown size={16} />}>
									{selectedMilestoneName}
								</Button>
							</DropdownTrigger>
							<DropdownMenu
								aria-label='Filter Milestone'
								selectionMode='single'
								selectedKeys={[selectedMilestoneId.toString()]}
								items={milestoneOptions}
								onSelectionChange={(keys: Selection) => {
									const key = Array.from(keys)[0];
									setSelectedMilestoneId(String(key));
								}}>
								{(item) => <DropdownItem key={item.id}>{item.title}</DropdownItem>}
							</DropdownMenu>
						</Dropdown>
					}>
					<EstimationChart data={filteredEstimationData} />
				</ChartCard>
			)}
		</div>
	);
}

// Komponen Pembungkus untuk Chart
const ChartCard = ({
	title,
	children,
	extraHeaderContent,
}: {
	title: string;
	children: React.ReactNode;
	extraHeaderContent?: React.ReactNode;
}) => (
	<div className='bg-white p-6 rounded-xl border-2 border-gray-200'>
		<div className='flex justify-between items-center mb-4'>
			<h3 className='text-xl font-bold text-text-main'>{title}</h3>
			{extraHeaderContent}
		</div>
		{children}
	</div>
);

// Komponen Pembungkus untuk Stat Card
const StatCard = ({ title, value }: { title: string; value: number }) => (
	<div className='bg-white p-6 rounded-xl border-2 border-gray-200'>
		<p className='text-gray-500'>{title}</p>
		<p className='text-4xl font-bold text-text-main mt-2'>{value}</p>
	</div>
);
