"use client";

import {
	Button,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Tooltip,
	Switch,
} from "@heroui/react";
import { Eye, EyeOff, UserCheck, SortAsc, SortDesc } from "lucide-react";
import type { ProjectRole } from "@/src/types/project";
import type { TaskSortBy } from "@/src/types/task";
import type { SortDescriptor } from "@react-types/shared";

interface TaskFilterControlsProps {
	filters: {
		hideCompleted: boolean;
		showOnlyMyTasks: boolean;
	};
	onFilterChange: (filterName: "hideCompleted" | "showOnlyMyTasks") => void;
	sortDescriptor: SortDescriptor;
	onSortChange: (descriptor: SortDescriptor) => void;
	userProjectRole: ProjectRole;
}

const sortOptions: { key: TaskSortBy; label: string }[] = [
	{ key: "display_order", label: "Urutan" },
	{ key: "title", label: "Nama" },
	{ key: "due_date", label: "Tenggat" },
	{ key: "start_date", label: "Tanggal Mulai" },
	{ key: "created_at", label: "Tanggal Dibuat" },
	{ key: "priority", label: "Prioritas" },
	{ key: "status", label: "Status" },
];

export default function TaskFilterControls({
	filters,
	onFilterChange,
	sortDescriptor,
	onSortChange,
	userProjectRole,
}: TaskFilterControlsProps) {
	const selectedSortOption =
		sortOptions.find((opt) => opt.key === sortDescriptor.column)?.label ||
		"Urutan";

	return (
		<div className='flex items-center justify-between p-4 bg-gray-50 rounded-t-lg border-b border-gray-200'>
			<div className='flex items-center gap-4'>
				<Tooltip
					content={
						filters.hideCompleted
							? "Tampilkan Tugas Selesai"
							: "Sembunyikan Tugas Selesai"
					}>
					<Button
						isIconOnly
						variant='light'
						onPress={() => onFilterChange("hideCompleted")}>
						{filters.hideCompleted ? (
							<EyeOff size={20} className='text-gray-600' />
						) : (
							<Eye size={20} className='text-gray-600' />
						)}
					</Button>
				</Tooltip>
				{userProjectRole === "contributor" && (
					<Tooltip content='Hanya Tampilkan Tugas Saya'>
						<Switch
							isSelected={filters.showOnlyMyTasks}
							onChange={() => onFilterChange("showOnlyMyTasks")}
							size='sm'
							thumbIcon={<UserCheck />}>
							Tugas Saya
						</Switch>
					</Tooltip>
				)}
			</div>

			<div className='flex items-center gap-2'>
				<Dropdown>
					<DropdownTrigger>
						<Button variant='light'>Urutkan: {selectedSortOption}</Button>
					</DropdownTrigger>
					<DropdownMenu
						aria-label='Pilih kriteria urutan'
						selectionMode='single'
						selectedKeys={[sortDescriptor.column as string]}
						onSelectionChange={(keys) =>
							onSortChange({
								...sortDescriptor,
								column: Array.from(keys)[0] as TaskSortBy,
							})
						}>
						{sortOptions.map((opt) => (
							<DropdownItem key={opt.key}>{opt.label}</DropdownItem>
						))}
					</DropdownMenu>
				</Dropdown>
				<Tooltip
					content={
						sortDescriptor.direction === "ascending"
							? "Urutkan Menurun"
							: "Urutkan Menaik"
					}>
					<Button
						isIconOnly
						variant='light'
						onPress={() =>
							onSortChange({
								...sortDescriptor,
								direction:
									sortDescriptor.direction === "ascending" ? "descending" : "ascending",
							})
						}>
						{sortDescriptor.direction === "ascending" ? (
							<SortAsc size={20} />
						) : (
							<SortDesc size={20} />
						)}
					</Button>
				</Tooltip>
			</div>
		</div>
	);
}
