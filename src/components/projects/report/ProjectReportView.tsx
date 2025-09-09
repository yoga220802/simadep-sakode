"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { reportService } from "@/src/services/reportService";
import type { ProjectReportData } from "@/src/types/report";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import {
	AssigneeChart,
	PriorityChart,
	TotalTasksPieChart,
	WeeklyActivityChart,
	EstimationChart,
} from "./ReportCharts";

export default function ProjectReportView() {
	const params = useParams();
	const { id } = params;
	const { token } = useAuth();

	const [reportData, setReportData] = useState<ProjectReportData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchReportData = useCallback(async () => {
		if (token && typeof id === "string") {
			setIsLoading(true);
			setError(null);
			try {
				const data = await reportService.getProjectReport(token, id);
				setReportData(data);
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Gagal memuat data laporan proyek."
				);
			} finally {
				setIsLoading(false);
			}
		}
	}, [id, token]);

	useEffect(() => {
		fetchReportData();
	}, [fetchReportData]);

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

	const {
		summary,
		assigneePerformance,
		priorityDistribution,
		weeklyActivity,
		taskEstimation,
	} = reportData;

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
				{/* Kolom Kiri: Penerima Tugas & Aktivitas Mingguan */}
				<div className='lg:col-span-2 space-y-6'>
					<ChartCard title='Penerima Tugas'>
						<AssigneeChart data={assigneePerformance} />
					</ChartCard>
					<ChartCard title='Aktivitas Mingguan'>
						<WeeklyActivityChart data={weeklyActivity} />
					</ChartCard>
				</div>

				{/* Kolom Kanan: Total Tugas & Prioritas */}
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
			{taskEstimation && taskEstimation.length > 0 && (
				<ChartCard title='Perbandingan Estimasi dan Realisasi Waktu'>
					<EstimationChart data={taskEstimation} />
				</ChartCard>
			)}
		</div>
	);
}

// Komponen Pembungkus untuk Chart
const ChartCard = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => (
	<div className='bg-white p-6 rounded-xl border-2 border-gray-200'>
		<h3 className='text-xl font-bold text-text-main mb-4'>{title}</h3>
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
