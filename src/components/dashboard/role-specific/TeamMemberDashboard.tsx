"use client";

import { useEffect, useState } from "react";
import { memberDashboardService } from "@/src/services/memberDashboardService";
import type { StatCardData } from "@/src/types/dashboard";
import type { UpcomingTask } from "@/src/types/memberDashboard";

import StatCard from "../StatCard";
import TasksTable from "../TasksTable";

export default function TeamMemberDashboard() {
	const [statCards, setStatCards] = useState<StatCardData[]>([]);
	const [tasks, setTasks] = useState<UpcomingTask[]>([]);

	useEffect(() => {
		setStatCards(memberDashboardService.getMemberStatCards());
		setTasks(memberDashboardService.getUpcomingTasks());
	}, []);

	return (
		<div className='space-y-8'>
			{/* Kartu Statistik */}
			<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
				{statCards.map((card) => (
					<StatCard key={card.title} data={card} variant='pm' />
				))}
			</div>

			{/* Tabel Tugas Mendatang menggunakan komponen reusable */}
			<TasksTable tasks={tasks} title='Tugas Mendatang' />
		</div>
	);
}
