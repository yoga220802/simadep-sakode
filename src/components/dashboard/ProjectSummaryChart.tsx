"use client";

import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/src/types/dashboard";

const chartColors = {
	primary: "var(--color-primary)",
	secondary: "var(--color-secondary)",
	accent: "var(--color-accent)",
	border: "var(--simadep-border)",
};

interface ProjectSummaryChartProps {
	data: ChartDataPoint[];
}

export default function ProjectSummaryChart({
	data,
}: ProjectSummaryChartProps) {
	return (
		<div className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
			<div className='mb-4'>
				<h3 className='text-xl font-semibold text-gray-800'>Ringkasan Proyek</h3>
				<p className='text-sm text-gray-500'>Jan 1, 2025 - Des 1, 2026</p>
			</div>

			<div className='h-80'>
				<ResponsiveContainer width='100%' height='100%'>
					<AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
						{/* Definisi untuk gradien fill */}
						<defs>
							<linearGradient id='gradientMasuk' x1='0' y1='0' x2='0' y2='1'>
								<stop offset='5%' stopColor={chartColors.secondary} stopOpacity={0.8} />
								<stop offset='95%' stopColor={chartColors.secondary} stopOpacity={0} />
							</linearGradient>
							<linearGradient id='gradientBerjalan' x1='0' y1='0' x2='0' y2='1'>
								<stop offset='5%' stopColor={chartColors.primary} stopOpacity={0.8} />
								<stop offset='95%' stopColor={chartColors.primary} stopOpacity={0} />
							</linearGradient>
							<linearGradient id='gradientSelesai' x1='0' y1='0' x2='0' y2='1'>
								<stop offset='5%' stopColor={chartColors.accent} stopOpacity={0.8} />
								<stop offset='95%' stopColor={chartColors.accent} stopOpacity={0} />
							</linearGradient>
						</defs>

						<CartesianGrid strokeDasharray='3 3' vertical={false} />
						<XAxis
							dataKey='month'
							tick={{ fontSize: 12 }}
							axisLine={false}
							tickLine={false}
						/>
						<YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
						<Tooltip
							contentStyle={{
								backgroundColor: "white",
								border: `1px solid ${chartColors.border}`,
								borderRadius: "0.5rem",
							}}
						/>
						{/* Area untuk "Masuk" */}
						<Area
							type='monotone'
							dataKey='masuk'
							strokeWidth={3}
							stroke={chartColors.secondary}
							fill='url(#gradientMasuk)'
							name='Masuk'
						/>
						{/* Area untuk "Berjalan" */}
						<Area
							type='monotone'
							dataKey='berjalan'
							strokeWidth={3}
							stroke={chartColors.primary}
							fill='url(#gradientBerjalan)'
							name='Berjalan'
						/>
						{/* Area untuk "Selesai" */}
						<Area
							type='monotone'
							dataKey='selesai'
							strokeWidth={3}
							stroke={chartColors.accent}
							fill='url(#gradientSelesai)'
							name='Selesai'
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
