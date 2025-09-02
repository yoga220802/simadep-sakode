"use client";

import React, { useState } from "react";
import type { Task } from "@/src/types/task";
import type { ProjectMember, ProjectRole } from "@/src/types/project";
import { ChevronRight, Plus } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { id } from "date-fns/locale";
import AssignTaskPopover from "./AssignTaskPopover";
import { Button, Tooltip } from "@heroui/react";
import TaskStatusCheckbox from "./TaskStatusCheckbox";
import { useAuth } from "@/src/context/AuthContext";
import { taskService } from "@/src/services/taskService";

const PriorityBadge = ({ priority }: { priority: Task["priority"] }) => {
	if (!priority) return null;
	const styles: Record<string, string> = {
		low: "bg-green-500",
		medium: "bg-blue-500",
		high: "bg-red-500",
	};
	const textStyles: Record<string, string> = {
		low: "Rendah",
		medium: "Sedang",
		high: "Tinggi",
	};
	return (
		<span
			className={`px-3 py-1 text-sm font-semibold rounded-full text-white ${
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

interface TaskRowProps {
	task: Task;
	projectMembers: ProjectMember[];
	userProjectRole: ProjectRole;
	onAssign: (taskId: number, userId: number) => void;
	onUnassign: (taskId: number, userId: number) => void;
	onUpdate: () => void;
	onSubtaskCreate: (parentTask: Task) => void;
	onTaskEdit: (task: Task) => void;
	level?: number;
}

export default function TaskRow({
	task,
	projectMembers,
	userProjectRole,
	onAssign,
	onUnassign,
	onUpdate,
	onSubtaskCreate,
	onTaskEdit,
	level = 0,
}: TaskRowProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const { token } = useAuth();

	const hasSubtasks = task.sub_tasks && task.sub_tasks.length > 0;
	const canEdit = userProjectRole === "owner";

	const handleStatusChange = async (newStatus: Task["status"]) => {
		if (!token || !newStatus) return;
		try {
			await taskService.updateTaskStatus(token, task.id, newStatus);
			onUpdate();
		} catch (error) {
			console.error("Gagal mengubah status tugas:", error);
		}
	};

	return (
		<React.Fragment>
			<tr className='hover:bg-gray-50 group'>
				<td className='py-3 px-6 whitespace-nowrap'>
					{/* [REVISI] Menggunakan inline style untuk padding dinamis */}
					<div
						className='flex items-center gap-2'
						style={{ paddingLeft: `${level * 24}px` }}>
						{hasSubtasks ? (
							<Button
								isIconOnly
								size='sm'
								variant='light'
								onPress={() => setIsExpanded(!isExpanded)}
								className='-ml-2'>
								<ChevronRight
									size={16}
									className={`transition-transform ${
										isExpanded ? "rotate-90" : "rotate-0"
									}`}
								/>
							</Button>
						) : (
							<div className='w-6'></div>
						)}
						<TaskStatusCheckbox
							status={task.status}
							userProjectRole={userProjectRole}
							onChange={handleStatusChange}
						/>
						<span
							className='font-medium text-gray-900 cursor-pointer hover:underline'
							onClick={() => onTaskEdit(task)}>
							{task.name}
						</span>
						{canEdit && (
							<Tooltip content='Tambah Subtugas'>
								<Button
									isIconOnly
									size='sm'
									variant='light'
									className='opacity-0 group-hover:opacity-100'
									onPress={() => onSubtaskCreate(task)}>
									<Plus size={16} />
								</Button>
							</Tooltip>
						)}
					</div>
				</td>
				<td className='py-3 px-6 whitespace-nowrap'>
					<AssignTaskPopover
						task={task}
						projectMembers={projectMembers.filter(
							(m) => m.project_role === "contributor"
						)}
						onAssign={onAssign}
						onUnassign={onUnassign}>
						<div className='flex items-center -space-x-2 cursor-pointer'>
							{task.assignees?.map((assignee) => (
								<Tooltip key={assignee.user_id} content={assignee.name}>
									<img
										src={assignee.profile_url}
										alt={assignee.name}
										width={32}
										height={32}
										className='rounded-full border-2 border-white'
									/>
								</Tooltip>
							))}
							{canEdit && (
								<div className='w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center hover:bg-gray-200'>
									<Plus size={16} className='text-gray-500' />
								</div>
							)}
						</div>
					</AssignTaskPopover>
				</td>
				<td className='py-3 px-6 whitespace-nowrap'>
					<DateDisplay dateString={task.due_date} />
				</td>
				<td className='py-3 px-6 whitespace-nowrap'>
					<PriorityBadge priority={task.priority} />
				</td>
			</tr>
			{isExpanded &&
				task.sub_tasks?.map((subtask) => (
					<TaskRow
						key={subtask.id}
						task={subtask}
						projectMembers={projectMembers}
						userProjectRole={userProjectRole}
						onAssign={onAssign}
						onUnassign={onUnassign}
						onUpdate={onUpdate}
						onSubtaskCreate={onSubtaskCreate}
						onTaskEdit={onTaskEdit}
						level={level + 1}
					/>
				))}
		</React.Fragment>
	);
}
