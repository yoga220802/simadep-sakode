"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { myTaskService } from "@/src/services/myTaskService";
import type { MyTask } from "@/src/types/task";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Spinner,
	Input, // Import Input component
} from "@heroui/react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { id } from "date-fns/locale";
import { Search } from "lucide-react"; // Import Search icon

// Komponen helper yang kita "pinjam" dari file lain
const PriorityBadge = ({ priority }: { priority: MyTask["priority"] }) => {
	if (!priority) return null;
	const styles: Record<string, string> = {
		low: "bg-green-500 text-white",
		medium: "bg-blue-500 text-white",
		high: "bg-red-500 text-white",
	};
	const textStyles: Record<string, string> = {
		low: "Rendah",
		medium: "Sedang",
		high: "Tinggi",
	};
	return (
		<span
			className={`px-3 py-1 text-sm font-semibold rounded-full ${
				styles[priority] || "bg-gray-400"
			}`}>
			{textStyles[priority] || priority}
		</span>
	);
};

const DateDisplay = ({ dateString }: { dateString: string | null }) => {
	if (!dateString) return <span className='text-gray-500'>-</span>;
	const date = new Date(dateString);
	if (isToday(date))
		return <span className='text-green-600 font-semibold'>Hari ini</span>;
	if (isTomorrow(date))
		return <span className='text-blue-600 font-semibold'>Besok</span>;
	if (isPast(date))
		return <span className='text-red-600 font-semibold'>Kemarin</span>;
	return <span>{format(date, "d MMM yyyy", { locale: id })}</span>;
};
// Akhir dari komponen helper

const COLUMNS = [
	{ key: "name", label: "NAMA TUGAS" },
	{ key: "projectName", label: "PROYEK" },
	{ key: "due_date", label: "TENGGAT" },
	{ key: "priority", label: "PRIORITAS" },
];

export default function MyTasksPage() {
	const [tasks, setTasks] = useState<MyTask[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [filterValue, setFilterValue] = useState(""); // State untuk search

	useEffect(() => {
		const fetchTasks = async () => {
			setIsLoading(true);
			try {
				const data = await myTaskService.getMyTasks();
				setTasks(data);
			} catch (error) {
				console.error("Gagal mengambil data tugas:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchTasks();
	}, []);

	// Logika untuk memfilter tugas berdasarkan input search
	const filteredTasks = useMemo(() => {
		if (!filterValue) return tasks;
		return tasks.filter(
			(task) =>
				task.name.toLowerCase().includes(filterValue.toLowerCase()) ||
				task.projectName.toLowerCase().includes(filterValue.toLowerCase())
		);
	}, [tasks, filterValue]);

	const renderCell = (task: MyTask, columnKey: keyof MyTask) => {
		switch (columnKey) {
			case "name":
				return (
					<Link
						href={`/projects/${task.projectId}?tab=daftar`}
						className='font-semibold text-gray-800 hover:text-[var(--color-primary)] hover:underline'>
						{task.name}
					</Link>
				);
			case "projectName":
				return (
					<Link
						href={`/projects/${task.projectId}`}
						className='text-gray-600 hover:underline'>
						{task.projectName}
					</Link>
				);
			case "due_date":
				return <DateDisplay dateString={task.due_date} />;
			case "priority":
				return <PriorityBadge priority={task.priority} />;
			default:
				return task[columnKey] as any;
		}
	};

	return (
		<div className='bg-white p-6 rounded-xl border-2 border-gray-200'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold text-text-main'>Tugas Saya</h1>
				<Input
					isClearable
					className='w-full sm:max-w-[44%]'
					placeholder='Cari tugas atau proyek...'
					startContent={<Search />}
					value={filterValue}
					onClear={() => setFilterValue("")}
					onValueChange={setFilterValue}
				/>
			</div>

			<Table aria-label='Tabel Daftar Tugas Saya'>
				<TableHeader columns={COLUMNS}>
					{(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
				</TableHeader>
				<TableBody
					items={filteredTasks} // Gunakan data yang sudah difilter
					isLoading={isLoading}
					loadingContent={<Spinner label='Memuat...' />}>
					{(item) => (
						<TableRow key={item.id}>
							{(columnKey) => (
								<TableCell>{renderCell(item, columnKey as keyof MyTask)}</TableCell>
							)}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
