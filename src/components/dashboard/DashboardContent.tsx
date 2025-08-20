"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { dashboardService } from "@/src/services/dashboardService";
import { dashboardConfig } from "@/src/config/DashboardConfig";
import StatCard from "./StatCard";
import WelcomeBanner from "./WelcomeBanner";
import { LoaderCircle } from "lucide-react";
import { Role } from "@/src/types/auth";
import { StatCardData } from "@/src/types/dashboard";

export default function DashboardContent() {
	const { user } = useAuth();
	const [statCards, setStatCards] = useState<StatCardData[]>([]);
	const [dashboardData, setDashboardData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (user) {
			setIsLoading(true);
			const cards = dashboardService.getStatCardsByRole(user.role);
			const data = dashboardService.getDashboardData(user.role);
			setStatCards(cards);
			setDashboardData(data);
			setIsLoading(false);
		}
	}, [user]);

	if (isLoading || !user) {
		return (
			<div className='flex items-center justify-center h-full'>
				<LoaderCircle className='w-12 h-12 animate-spin text-primary' />
			</div>
		);
	}

	const config = dashboardConfig[user.role as Role];

	return (
		<div className='space-y-8'>
			{/* Stat Cards */}
			<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
				{statCards.map((card) => (
					<StatCard key={card.title} data={card} />
				))}
			</div>

			{/* Dynamic Components based on Role */}
			{config &&
				dashboardData &&
				config.components.map((Component, index) => (
					<div key={index}>{Component(dashboardData)}</div>
				))}
		</div>
	);
}
