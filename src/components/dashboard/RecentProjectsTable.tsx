"use client";

import type { RecentProject } from "@/src/types/pmDashboard";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
} from "@heroui/react";

interface RecentProjectsTableProps {
	projects: RecentProject[];
}

export default function RecentProjectsTable({
	projects,
}: RecentProjectsTableProps) {
	return (
		<div className='rounded-lg border border-gray-200 bg-white shadow-sm'>
			<div className='px-6 py-5 border-b border-gray-200'>
				<h3 className='text-xl font-semibold text-gray-800'>Proyek</h3>
			</div>

			<Table
				aria-label='Tabel Proyek Terbaru'
				classNames={{
					wrapper: "p-0 shadow-none rounded-none",
					thead: "bg-gray-50",
					th: "px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider",
					tbody: "bg-white divide-y divide-gray-200",
					tr: "hover:bg-gray-50",
					td: "px-6 py-4 whitespace-nowrap text-sm text-gray-700",
				}}>
				<TableHeader>
					<TableColumn>NAMA PROYEK</TableColumn>
					<TableColumn>JUMLAH TUGAS</TableColumn>
					<TableColumn>TENGGAT WAKTU</TableColumn>
				</TableHeader>
				<TableBody>
					{projects.map((project) => (
						<TableRow key={project.id}>
							<TableCell className='font-medium text-gray-900'>
								{project.name}
							</TableCell>
							<TableCell>{project.taskCount}</TableCell>
							<TableCell>{project.dueDate}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
