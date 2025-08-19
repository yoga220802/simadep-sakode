import type { StatCardData } from "@/src/types/pmDashboard";
import {
	Briefcase,
    ClipboardList,
	CheckCircle,
	CircleArrowOutDownLeft,
	ArrowUp,
	ArrowDown,
} from "lucide-react";

const iconMap: { [key: string]: React.ElementType } = {
	"Proyek Aktif": ClipboardList,
	"Proyek Selesai": CheckCircle,
	"Proyek Masuk": CircleArrowOutDownLeft,
};

export default function StatCard({ data }: { data: StatCardData }) {
	const Icon = iconMap[data.title] || Briefcase;
	const isIncrease = data.changeType === "increase";

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
					<span
						className={`flex items-center gap-1 text-sm font-medium ${
							isIncrease ? "text-green-500" : "text-red-500"
						}`}>
						{isIncrease ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
						{Math.abs(data.change)}%
					</span>
				</div>
			</div>
		</div>
	);
}
