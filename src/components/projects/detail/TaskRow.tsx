"use client";

import { useState } from "react";
import type { Task } from "@/src/types/task";
import type { ProjectMember, ProjectRole } from "@/src/types/project";
import { ChevronRight, Check, Circle, Plus } from "lucide-react";
import Image from "next/image";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { id } from "date-fns/locale";
import AssignTaskPopover from "./AssignTaskPopover";
import { Button } from "@heroui/react"; // Import HeroUI Button

interface TaskRowProps {
	task: Task;
	projectMembers: ProjectMember[];
	onAssign: (taskId: number, userId: number) => void;
	onUnassign: (taskId: number, userId: number) => void;
	onUpdate: () => void; // Added onUpdate prop
	userProjectRole: ProjectRole; // Added userProjectRole prop
	onTaskSelect: (task: Task | null) => void; // Added onTaskSelect prop
	onSubtaskCreate: (parentTask: Task) => void; // Added onSubtaskCreate prop
	level?: number;
}

// ... (Komponen PriorityBadge dan DateDisplay tetap sama)
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

export default function TaskRow({
	task,
	projectMembers,
	onAssign,
	onUnassign,
	onUpdate,
	userProjectRole, // Destructure userProjectRole
	onTaskSelect, // Destructure onTaskSelect
	onSubtaskCreate, // Destructure onSubtaskCreate
	level = 0,
}: TaskRowProps) {
	const [isExpanded, setIsExpanded] = useState(true);

	const hasSubtasks = task.sub_tasks && task.sub_tasks.length > 0;
	const isCompleted = task.status === "completed";

	return (
		<>
			<tr className='hover:bg-gray-50'>
				<td className='py-3 px-6 whitespace-nowrap'>
					{/* ... (bagian expand, checkbox, dan nama task tetap sama) */}
					<div
						className='flex items-center'
						style={{ paddingLeft: `${level * 24}px` }}>
						{hasSubtasks ? (
							<Button onPress={() => setIsExpanded(!isExpanded)} className='mr-2 p-1'>
								<ChevronRight
									size={16}
									className={`transition-transform ${
										isExpanded ? "rotate-90" : "rotate-0"
									}`}
								/>
							</Button>
						) : (
							<div className='w-6 mr-2'></div>
						)}
						<button className='mr-3 p-1'>
							{isCompleted ? (
								<Check size={18} className='text-white bg-orange-500 rounded-md' />
							) : (
								<Circle size={18} className='text-gray-300' />
							)}
						</button>
						<span className='font-medium text-gray-900'>{task.name}</span>
					</div>
				</td>
				<td className='py-3 px-6 whitespace-nowrap'>
					<AssignTaskPopover
						task={task}
						projectMembers={projectMembers}
						onAssign={onAssign}
						onUnassign={onUnassign}>
						<div className='flex items-center -space-x-2 cursor-pointer'>
							{task.assignees?.map((assignee) => (
								<Image
									key={assignee.user_id}
									src={assignee.avatarUrl || `https://randomuser.me/api/portraits/lego/${assignee.user_id % 10}.jpg`}
									alt={assignee.name}
									width={32}
									height={32}
									className='rounded-full border-2 border-white'
									unoptimized
								/>
							))}
							<div className='w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center hover:bg-gray-200'>
								<Plus size={16} className='text-gray-500' />
							</div>
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
				hasSubtasks &&
				task.sub_tasks?.map((subtask) => (
					<TaskRow
						key={subtask.id}
						task={subtask}
						projectMembers={projectMembers}
						onAssign={onAssign}
						onUnassign={onUnassign}
						onUpdate={onUpdate} // Ensure onUpdate is passed
						level={level + 1}
						userProjectRole={userProjectRole}
						onTaskSelect={onTaskSelect}
						onSubtaskCreate={onSubtaskCreate}
					/>
				))}
		</>
	);
}
