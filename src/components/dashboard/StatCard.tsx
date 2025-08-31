import { StatCardData } from "@/src/types/dashboard";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
	data: StatCardData;
}

export default function StatCard({ data }: StatCardProps) {
	const Icon = data.icon;
	const isIncrease = data.changeType === "increase";
	const hasChange = data.change !== undefined && data.changeType !== undefined;

	return (
		<div className='rounded-xl border-2 border-[#E4E7EC] bg-white p-6 transition-shadow hover:shadow-lg'>
			<div className='flex items-start justify-between'>
				<div className='flex items-center gap-4'>
					<div className='flex h-[50px] w-[50px] items-center justify-center rounded-lg bg-[var(--color-primary)]/10'>
						<Icon className='h-7 w-7 text-[var(--color-primary)]' />
					</div>
					<p className='text-xl font-semibold text-[#667085]'>{data.title}</p>
				</div>
			</div>

			<div className='mt-5 flex items-end justify-between'>
				<p className='text-5xl font-bold text-[#3B4852]'>{data.value}</p>
				{hasChange && (
					<span
						className={`flex items-center gap-1 text-base font-semibold ${
							isIncrease ? "text-green-500" : "text-red-500"
						}`}>
						{isIncrease ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
						{Math.abs(data.change!)}%
					</span>
				)}
			</div>
		</div>
	);
}
