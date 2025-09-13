"use client";

import Link from "next/link";
import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Button,
} from "@heroui/react";
import { MoreVertical, Edit, Trash2, Calendar, ListTodo } from "lucide-react";
import type { Project } from "@/src/types/project";
import { useAuth } from "@/src/context/AuthContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Helper untuk styling status
const StatusBadge = ({ status }: { status: Project["status"] }) => {
	const styles: Record<Project["status"], string> = {
		tender: "bg-yellow-100 text-yellow-600",
		active: "bg-blue-100 text-blue-600",
		completed: "bg-green-100 text-green-600",
		cancel: "bg-red-100 text-red-600",
	};
	return (
		<span
			className={`px-3 py-1 text-sm font-semibold rounded-full ${styles[status]}`}>
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</span>
	);
};

// Helper untuk format tanggal
const formatDateRange = (start: string | null, end: string | null) => {
	if (!start || !end) return "Tanggal belum ditentukan";
	try {
		const startDate = format(new Date(start), "d MMM yyyy", { locale: id });
		const endDate = format(new Date(end), "d MMM yyyy", { locale: id });
		return `${startDate} - ${endDate}`;
	} catch (error) {
		return "Format tanggal tidak valid";
	}
};

interface ProjectCardProps {
	project: Project;
	onEdit: (project: Project) => void;
	onDelete: (project: Project) => void;
}

export default function ProjectCard({
	project,
	onEdit,
	onDelete,
}: ProjectCardProps) {
	const { user } = useAuth();
	const canEdit = user?.role === "Project Manager";

	return (
		<div className='bg-white p-6 rounded-xl border-2 border-gray-200 hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between'>
			<div>
				<div className='flex justify-between items-start mb-4'>
					<h3 className='text-xl font-bold text-text-main hover:text-[var(--color-primary)] transition-colors'>
						<Link href={`/projects/${project.id}`}>{project.title}</Link>
					</h3>
					{canEdit && (
						<Dropdown>
							<DropdownTrigger>
								<Button isIconOnly variant='light' size='sm'>
									<MoreVertical className='text-gray-500' />
								</Button>
							</DropdownTrigger>
							<DropdownMenu aria-label='Aksi Proyek'>
								<DropdownItem
									key='edit'
									startContent={<Edit size={16} />}
									onPress={() => onEdit(project)}>
									Edit Proyek
								</DropdownItem>
								<DropdownItem
									key='delete'
									className='text-danger'
									color='danger'
									startContent={<Trash2 size={16} />}
									onPress={() => onDelete(project)}>
									Hapus Proyek
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					)}
				</div>
				<div className='space-y-3 text-gray-600'>
					<div className='flex items-center gap-2'>
						<Calendar size={16} />
						<span>{formatDateRange(project.start_date, project.end_date)}</span>
					</div>
					<div className='flex items-center gap-2'>
						<ListTodo size={16} />
						<span>{project.stats?.total_tasks ?? 0} Tugas</span>
					</div>
				</div>
			</div>
			<div className='mt-6'>
				<StatusBadge status={project.status} />
			</div>
		</div>
	);
}
