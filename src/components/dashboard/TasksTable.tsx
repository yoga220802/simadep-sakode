"use client";

import type { UpcomingTask } from "@/src/types/memberDashboard";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
} from "@heroui/react";

// Komponen Badge untuk Prioritas
const PriorityBadge = ({
	priority,
}: {
	priority: UpcomingTask["priority"];
}) => {
	const baseClasses =
		"inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold";
	const styles = {
		Tinggi: "bg-red-100 border-red-500 text-red-600",
		Sedang: "bg-yellow-100 border-yellow-500 text-yellow-600",
		Rendah: "bg-green-100 border-green-500 text-green-600",
	};
	return (
		<span className={`${baseClasses} ${styles[priority]}`}>{priority}</span>
	);
};

// Props untuk komponen TasksTable yang baru
interface TasksTableProps {
	tasks: UpcomingTask[];
	title: string; // Menambahkan prop title
}

export default function TasksTable({ tasks, title }: TasksTableProps) {
	return (
		<div className='rounded-xl border-2 border-[#E4E7EC] bg-white'>
			<div className='px-6 py-5'>
				{/* Menggunakan title dari props */}
				<h3 className='font-palanquin text-2xl font-bold text-[#3B4852]'>
					{title}
				</h3>
			</div>
			<div className='overflow-x-auto'>
				<Table
					aria-label={title}
					classNames={{
						wrapper: "p-0 shadow-none rounded-none",
						thead: "bg-[#F2F4F7]",
						th: "px-6 py-4 text-left text-sm font-bold text-[#3B4852] uppercase tracking-wider border-b-2 border-[#E4E7EC]",
						tbody: "bg-white divide-y divide-[#E4E7EC]",
						tr: "hover:bg-gray-50",
						td: "px-6 py-4 whitespace-nowrap text-base text-[#667085]",
					}}>
					<TableHeader>
						<TableColumn>NAMA TUGAS</TableColumn>
						<TableColumn>PROYEK</TableColumn>
						<TableColumn>TENGGAT WAKTU</TableColumn>
						<TableColumn>PRIORITAS</TableColumn>
					</TableHeader>
					<TableBody>
						{tasks.map((task) => (
							<TableRow key={task.id}>
								<TableCell className='font-semibold text-gray-800'>
									{task.taskName}
								</TableCell>
								<TableCell>{task.projectName}</TableCell>
								<TableCell>{task.dueDate}</TableCell>
								<TableCell>
									<PriorityBadge priority={task.priority} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
