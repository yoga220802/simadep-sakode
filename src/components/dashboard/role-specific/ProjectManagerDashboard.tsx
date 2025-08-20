"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/src/services/pmDashboardService";
import type {
	StatCardData,
	ChartDataPoint,
	RecentProject,
} from "@/src/types/dashboard";

import StatCard from "../StatCard";
import ProjectSummaryChart from "../ProjectSummaryChart";
import RecentProjectsTable from "../RecentProjectsTable";

export default function ProjectManagerDashboard() {
	// State untuk menyimpan data dashboard
	const [statCards, setStatCards] = useState<StatCardData[]>([]);
	const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
	const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

	useEffect(() => {
		setStatCards(dashboardService.getPmStatCards());
		setChartData(dashboardService.getProjectSummaryChartData());
		setRecentProjects(dashboardService.getRecentProjects());
	}, []);

	return (
		<div className='space-y-6'>
			{/* Bagian Kartu Statistik */}
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
				{statCards.map((cardData) => (
					<StatCard key={cardData.title} data={cardData} />
				))}
			</div>

			{/* Bagian Chart dan Tabel */}
			<div className='grid grid-cols-1 gap-6'>
				<ProjectSummaryChart data={chartData} />
				<RecentProjectsTable projects={recentProjects} />
			</div>
		</div>
	);
}
