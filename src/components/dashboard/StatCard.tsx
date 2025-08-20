import type { StatCardData } from "@/src/types/dashboard";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
	data: StatCardData;
	variant?: "pm" | "admin"; // Varian untuk styling
}

export default function StatCard({ data, variant = "pm" }: StatCardProps) {
	const Icon = data.icon;
	const isIncrease = data.changeType === "increase";

	// Styling untuk varian PM
	if (variant === "pm") {
		return (
			<div className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
				<div className='flex items-center justify-between'>
					<div className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/10'>
						<Icon className='h-6 w-6 text-primary' />
					</div>
				</div>
				<div className='mt-4'>
					<h4 className='text-3xl font-bold text-gray-800'>{data.value}</h4>
					<div className='flex items-center justify-between'>
						<span className='text-sm font-medium text-gray-500'>{data.title}</span>
						{/* Tampilkan change indicator hanya jika datanya ada */}
						{data.change !== undefined && (
							<span
								className={`flex items-center gap-1 text-sm font-medium ${
									isIncrease ? "text-green-500" : "text-red-500"
								}`}>
								{isIncrease ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
								{Math.abs(data.change)}%
							</span>
						)}
					</div>
				</div>
			</div>
		);
	}

	// Styling untuk varian Admin
	if (variant === "admin") {
		return (
			<div className='rounded-xl border-2 border-[#E4E7EC] bg-white p-6'>
				<div className='flex items-center gap-4'>
					<div className='flex h-[50px] w-[50px] items-center justify-center rounded-lg bg-[#F2F4F7]'>
						<Icon className='h-7 w-7 text-[#3B4852]' />
					</div>
					<div>
						<p className='text-xl font-semibold text-[#667085]'>{data.title}</p>
					</div>
				</div>
				<p className='mt-5 text-5xl font-bold text-[#3B4852]'>{data.value}</p>
			</div>
		);
	}

	return null;
}
