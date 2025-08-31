"use client";

import { useState } from "react";
import type { Task } from "@/src/types/task";
import type { ProjectMember } from "@/src/types/project";
import { ChevronDown, Plus, MoreHorizontal } from "lucide-react";
import TaskRow from "./TaskRow";
import {
	Button,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
} from "@heroui/react";
import { useAuth } from "@/src/context/AuthContext";
import { taskService } from "@/src/services/taskService";
import { useParams } from "next/navigation";

interface MilestoneGroupProps {
	milestone: Task;
	projectMembers: ProjectMember[];
	onUpdate: () => void;
	onAssign: (taskId: number, userId: number) => void;
	onUnassign: (taskId: number, userId: number) => void;
}

export default function MilestoneGroup({
	milestone,
	projectMembers,
	onUpdate,
	onAssign,
	onUnassign,
}: MilestoneGroupProps) {
	const [isOpen, setIsOpen] = useState(true);
	const { token } = useAuth();
	const params = useParams();
	const projectId = Number(params.id);

	const handleAddTask = async () => {
		if (!token) return;
		try {
			await taskService.createTask(
				token,
				{
					project_id: projectId,
					name: "Tugas Baru",
					resource_type: "task",
				},
				milestone.id
			);
			onUpdate();
		} catch (error) {
			console.error("Gagal menambah tugas:", error);
		}
	};

	return (
		<div>
			<div className='flex items-center justify-between mb-2'>
				<div className='flex items-center gap-2'>
					<button title="show tasks" onClick={() => setIsOpen(!isOpen)} className='p-1'>
						<ChevronDown
							size={24}
							className={`transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
						/>
					</button>
					<h3 className='text-xl font-bold text-gray-800'>{milestone.name}</h3>
				</div>
				<div>
					<Button
						isIconOnly
						variant='light'
						size='sm'
						className='mr-2'
						onPress={handleAddTask}>
						<Plus size={18} />
					</Button>
					<Dropdown>
						<DropdownTrigger>
							<Button isIconOnly variant='light' size='sm'>
								<MoreHorizontal size={18} />
							</Button>
						</DropdownTrigger>
						<DropdownMenu aria-label='Milestone Actions'>
							<DropdownItem key='edit'>Edit Milestone</DropdownItem>
							<DropdownItem key='delete' className='text-danger' color='danger'>
								Hapus Milestone
							</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</div>
			</div>

			{isOpen && (
				<div className='overflow-x-auto rounded-lg border border-gray-200'>
					<table className='min-w-full bg-white'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5'>
									Nama
								</th>
								<th className='py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Penerima Tugas
								</th>
								<th className='py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Tenggat
								</th>
								<th className='py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Prioritas
								</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-gray-200'>
							{milestone.sub_tasks?.map((task) => (
								<TaskRow
									key={task.id}
									task={task}
									projectMembers={projectMembers}
									onAssign={onAssign}
									onUnassign={onUnassign}
								/>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
