import type { LucideIcon } from "lucide-react";

interface DetailItemProps {
	icon: LucideIcon;
	label: string;
	children: React.ReactNode;
}

export default function DetailItem({
	icon: Icon,
	label,
	children,
}: DetailItemProps) {
	return (
		<div className='grid grid-cols-3 items-start gap-4'>
			<div className='col-span-1 flex items-center gap-3 text-gray-600'>
				<Icon size={20} />
				<span className='font-semibold'>{label}</span>
			</div>
			<div className='col-span-2'>{children}</div>
		</div>
	);
}
