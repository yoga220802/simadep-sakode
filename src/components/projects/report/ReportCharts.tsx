"use client";

import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	PieChart,
	Pie,
	Cell,
	AreaChart,
	Area,
	CartesianGrid,
} from "recharts";
import type {
	AssigneePerformance,
	PriorityDistribution,
	WeeklyActivity,
	TaskEstimation,
} from "@/src/types/report";
import Image from "next/image";
import type { TooltipProps } from "recharts";
import type {
	ValueType,
	NameType,
} from "recharts/types/component/DefaultTooltipContent";
import type { XAxisProps } from "recharts";

const chartColors = {
	primary: "var(--color-primary)",
	secondary: "var(--color-secondary)",
	accent: "var(--color-accent)",
	muted: "var(--simadep-muted)",
	border: "var(--simadep-border)",
	cursor: "var(--simadep-primary-soft)",
};

// Tooltip kustom untuk menampilkan avatar
const CustomAssigneeTooltip = ({
	active,
	payload,
}: TooltipProps<ValueType, NameType> & {
	payload?: { payload: AssigneePerformance }[];
}) => {
	if (active && payload && payload.length) {
		const data = payload[0].payload;
		return (
			<div className='p-2 bg-white border rounded-lg shadow-lg flex items-center gap-2'>
				<Image
					src={
						data.assignee.avatarUrl ||
						`https://i.pravatar.cc/32?u=${data.assignee.user_id}`
					}
					alt={`Avatar of ${data.assignee.name}`}
					width={32}
					height={32}
					className='rounded-full'
					unoptimized
				/>
				<div>
					<p className='font-semibold'>{data.assignee.name}</p>
					<p className='text-xs text-gray-500'>Selesai: {data.selesai}</p>
					<p className='text-xs text-gray-500'>Belum Selesai: {data.inProgress}</p>
				</div>
			</div>
		);
	}
	return null;
};

// --- Komponen kustom untuk label sumbu X dengan avatar ---
interface CustomizedAxisTickProps extends XAxisProps {
	x?: number;
	y?: number;
	payload?: {
		value: string;
	};
	data: AssigneePerformance[];
}

const CustomizedAxisTick = ({
	x = 0,
	y = 0,
	payload,
	data,
}: CustomizedAxisTickProps) => {
	if (!payload) return null;
	const assignee = data.find(
		(d: AssigneePerformance) => d.assignee.name === payload.value
	)?.assignee;

	if (!assignee) return null;

	const titleId = `tick-avatar-title-${assignee.user_id}`;

	return (
		<g transform={`translate(${x},${y})`}>
			<title id={titleId}>{`Avatar of ${assignee.name}`}</title>
			<defs>
				<clipPath id={`clip-avatar-${assignee.user_id}`}>
					<circle cx='0' cy='26' r='16' />
				</clipPath>
			</defs>
			<image
				x={-16}
				y={10}
				width={32}
				height={32}
				href={
					assignee.avatarUrl || `https://i.pravatar.cc/32?u=${assignee.user_id}`
				}
				clipPath={`url(#clip-avatar-${assignee.user_id})`}
				role='img'
				aria-labelledby={titleId}
			/>
			<text
				x={0}
				y={55}
				dy={0}
				textAnchor='middle'
				fill={chartColors.muted}
				fontSize={12}>
				{payload.value}
			</text>
		</g>
	);
};

// 1. Chart Penerima Tugas
export function AssigneeChart({ data }: { data: AssigneePerformance[] }) {
	const maxTasks = Math.max(...data.map((d) => d.selesai + d.inProgress), 5);
	const yAxisDomain = [0, Math.ceil(maxTasks * 1.2)];
	const barSize = Math.max(15, 60 - data.length * 5);

	return (
		<ResponsiveContainer width='100%' height={300}>
			<BarChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 60 }}>
				<XAxis
					dataKey='assignee.name'
					tickLine={false}
					axisLine={false}
					tick={<CustomizedAxisTick data={data} />}
					interval={0}
					height={60}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tick={{ fontSize: 12 }}
					domain={yAxisDomain}
				/>
				<Tooltip
					content={<CustomAssigneeTooltip />}
					cursor={{ fill: chartColors.cursor }}
				/>
				<Legend
					iconType='circle'
					verticalAlign='top'
					align='right'
					formatter={(value) => (
						<span className='capitalize text-gray-600'>{value}</span>
					)}
				/>
				<Bar
					dataKey='inProgress'
					name='Belum Selesai'
					stackId='a'
					fill={chartColors.primary}
					barSize={barSize}
				/>
				<Bar
					dataKey='selesai'
					name='Selesai'
					stackId='a'
					fill={chartColors.accent}
					radius={[4, 4, 0, 0]}
					barSize={barSize}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
}

const COLORS = {
	Tinggi: chartColors.secondary,
	Sedang: chartColors.primary,
	Rendah: chartColors.accent,
};

// 2. Chart Prioritas
export function PriorityChart({ data }: { data: PriorityDistribution[] }) {
	return (
		<ResponsiveContainer width='100%' height={300}>
			<BarChart data={data} margin={{ top: 20 }}>
				<XAxis
					dataKey='name'
					tickLine={false}
					axisLine={false}
					tick={{ fontSize: 12 }}
				/>
				<YAxis hide />
				<Tooltip
					cursor={{ fill: "transparent" }}
					contentStyle={{
						backgroundColor: "white",
						border: `1px solid ${chartColors.border}`,
						borderRadius: "0.5rem",
					}}
				/>
				<Bar dataKey='value' name='Jumlah Tugas' radius={[4, 4, 0, 0]}>
					{data.map((entry) => (
						<Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />
					))}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}

// 3. Chart Total Tugas (Pie)
export function TotalTasksPieChart({
	completed,
	inProgress,
}: {
	completed: number;
	inProgress: number;
}) {
	const data = [
		{ name: "Selesai", value: completed },
		{ name: "Belum Selesai", value: inProgress },
	];
	const PIE_COLORS = [chartColors.accent, chartColors.secondary];
	const total = completed + inProgress;

	return (
		<div className='relative w-full h-48'>
			<ResponsiveContainer width='100%' height='100%'>
				<PieChart>
					<Tooltip
						contentStyle={{
							backgroundColor: "white",
							border: `1px solid ${chartColors.border}`,
							borderRadius: "0.5rem",
						}}
					/>
					<Legend
						iconType='circle'
						wrapperStyle={{ fontSize: "12px", bottom: -10 }}
					/>
					<Pie
						data={data}
						cx='50%'
						cy='50%'
						innerRadius={50}
						outerRadius={70}
						startAngle={90}
						endAngle={450}
						paddingAngle={2}
						dataKey='value'>
						{data.map((entry, index) => (
							<Cell
								key={`cell-${index}`}
								fill={PIE_COLORS[index % PIE_COLORS.length]}
								stroke={PIE_COLORS[index % PIE_COLORS.length]}
							/>
						))}
					</Pie>
				</PieChart>
			</ResponsiveContainer>
			<div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
				<span className='text-3xl font-bold'>{total}</span>
				<span className='text-sm text-gray-500'>Total</span>
			</div>
		</div>
	);
}

// 4. Chart Aktivitas Mingguan
export function WeeklyActivityChart({ data }: { data: WeeklyActivity[] }) {
	return (
		<ResponsiveContainer width='100%' height={300}>
			<AreaChart data={data} margin={{ left: -20 }}>
				<CartesianGrid strokeDasharray='3 3' vertical={false} />
				<XAxis dataKey='date' tick={{ fontSize: 12 }} />
				<YAxis tick={{ fontSize: 12 }} />
				<Tooltip />
				<Legend iconType='circle' />
				<Area
					type='monotone'
					dataKey='total'
					name='Total'
					stroke={chartColors.primary}
					fill={chartColors.primary}
					fillOpacity={1}
				/>
				<Area
					type='monotone'
					dataKey='selesai'
					name='Selesai'
					stroke={chartColors.accent}
					fill={chartColors.accent}
					fillOpacity={1}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);
}

// 5. Chart Estimasi vs Realisasi (BARU)
export function EstimationChart({ data }: { data: TaskEstimation[] }) {
	return (
		<ResponsiveContainer width='100%' height={40 + data.length * 50}>
			<BarChart data={data} layout='vertical' barSize={15} margin={{ left: 100 }}>
				<CartesianGrid strokeDasharray='3 3' horizontal={false} />
				<XAxis type='number' unit=' hari' tick={{ fontSize: 12 }} />
				<YAxis
					type='category'
					dataKey='name'
					width={120}
					tick={{ fontSize: 12 }}
					axisLine={false}
					tickLine={false}
				/>
				<Tooltip
					contentStyle={{
						backgroundColor: "white",
						border: `1px solid ${chartColors.border}`,
						borderRadius: "0.5rem",
					}}
				/>
				<Legend iconType='circle' />
				<Bar
					dataKey='estimasi'
					name='Estimasi'
					fill={chartColors.primary}
					radius={[0, 4, 4, 0]}
				/>
				<Bar
					dataKey='selesai'
					name='Selesai'
					fill={chartColors.accent}
					radius={[0, 4, 4, 0]}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
}
