"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { dashboardService } from "@/src/services/dashboardService";
import {
	dashboardConfig,
	type DashboardRole,
} from "@/src/config/DashboardConfig";
import StatCard from "./StatCard";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import type {
	StatCardData,
	EmployeeData,
	ProjectData,
	TaskData,
	ChartDataPoint,
} from "@/src/types/dashboard";
import WelcomeBanner from "./WelcomeBanner";

type DashboardDataType = {
	statCards?: StatCardData[];
	employeeStatCards?: StatCardData[];
	projectStatCards?: StatCardData[];
	employees?: EmployeeData[];
	projects?: ProjectData[];
	tasks?: TaskData[];
	chartData?: ChartDataPoint[];
};

export default function DashboardContent() {
	const { user, token } = useAuth();
	const [dashboardData, setDashboardData] = useState<DashboardDataType | null>(
		null
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDashboardData = async () => {
			if (user && token && user.role !== "Viewer") {
				setIsLoading(true);
				setError(null);
				try {
					// Pastikan role yang dikirim adalah role yang valid untuk dashboard
					const data = await dashboardService.getDashboardData(
						user.role as DashboardRole,
						token
					);
					setDashboardData(data);
				} catch (err) {
					setError(
						err instanceof Error ? err.message : "Gagal memuat data dashboard."
					);
				} finally {
					setIsLoading(false);
				}
			} else {
				setIsLoading(false); // Selesai loading jika tidak ada user/token/role valid
			}
		};

		fetchDashboardData();
	}, [user, token]);

	if (isLoading || !user) {
		return (
			<div className='flex items-center justify-center h-[calc(100vh-150px)]'>
				<LoaderCircle className='w-12 h-12 animate-spin text-[var(--color-primary)]' />
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex flex-col items-center justify-center h-full pt-16 text-center'>
				<ShieldAlert className='w-16 h-16 text-red-500 mb-4' />
				<h2 className='text-2xl font-bold text-text-main mb-2'>
					Oops, Terjadi Kesalahan
				</h2>
				<p className='text-gray-500'>{error}</p>
			</div>
		);
	}

	// FIX: Cek apakah role user ada di dalam config sebelum mengaksesnya
	const isRoleConfigured = user.role in dashboardConfig;
	const config = isRoleConfigured
		? dashboardConfig[user.role as DashboardRole]
		: null;

	return (
		<div className='space-y-8'>
			{/* Tampilkan stat cards berdasarkan role */}
			{user.role === "Admin" &&
				dashboardData?.employeeStatCards &&
				dashboardData?.projectStatCards && (
					<>
						<div>
							<h2 className='text-2xl font-bold text-text-main mb-4'>
								Ringkasan Pegawai
							</h2>
							<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
								{dashboardData.employeeStatCards.map((card) => (
									<StatCard key={card.title} data={card} />
								))}
							</div>
						</div>
						<div>
							<h2 className='text-2xl font-bold text-text-main mb-4'>
								Ringkasan Proyek
							</h2>
							<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
								{dashboardData.projectStatCards.map((card) => (
									<StatCard key={card.title} data={card} />
								))}
							</div>
						</div>
					</>
				)}

			{(user.role === "Project Manager" || user.role === "Team Member") &&
				dashboardData?.statCards && (
					<div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
						{dashboardData.statCards.map((card) => (
							<StatCard key={card.title} data={card} />
						))}
					</div>
				)}

			{config &&
				dashboardData &&
				config.components.map(
					(Component: (data: DashboardDataType) => ReactNode, index: number) => (
						<div key={index}>{Component(dashboardData)}</div>
					)
				)}

			{!isRoleConfigured && user.role === "Viewer" && (
				<div className='p-8 bg-white rounded-lg border-2 border-gray-200 text-center'>
					<h2 className='text-xl font-bold'>Selamat Datang</h2>
					<p className='mt-2 text-gray-600'>
						Anda login sebagai Viewer. Silakan jelajahi proyek yang dapat Anda akses.
					</p>
				</div>
			)}
		</div>
	);
}
