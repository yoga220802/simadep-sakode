"use client";

import type { ProjectMember } from "@/src/types/project";
import type { Task, TaskAssignee } from "@/src/types/task";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
	Listbox,
	ListboxItem,
	Avatar,
	Chip,
} from "@heroui/react";
import { Plus } from "lucide-react";

interface AssignTaskPopoverProps {
	task: Task;
	projectMembers: ProjectMember[];
	onAssign: (taskId: number, userId: number) => void;
	onUnassign: (taskId: number, userId: number) => void;
	children: React.ReactNode;
}

export default function AssignTaskPopover({
	task,
	projectMembers,
	onAssign,
	onUnassign,
	children,
}: AssignTaskPopoverProps) {
	const assigneeIds = new Set(task.assignees?.map((a) => a.user_id));

	const handleSelection = (member: ProjectMember) => {
		if (assigneeIds.has(member.user_id)) {
			onUnassign(task.id, member.user_id);
		} else {
			onAssign(task.id, member.user_id);
		}
	};

	return (
		<Popover placement='bottom-start'>
			<PopoverTrigger>{children}</PopoverTrigger>
			<PopoverContent className='p-2'>
				<div className='w-72'>
					<h4 className='text-sm font-bold px-2 py-1.5'>Tugaskan kepada</h4>
					<Listbox
						aria-label='Assign task to member'
						variant='flat'
						onAction={(key) =>
							handleSelection(projectMembers.find((m) => m.user_id === key)!)
						}>
						{projectMembers.map((member) => (
							<ListboxItem
								key={member.user_id}
								textValue={member.name}
								endContent={
									assigneeIds.has(member.user_id) && (
										<Chip color='primary' size='sm' variant='flat'>
											Ditugaskan
										</Chip>
									)
								}>
								<div className='flex gap-2 items-center'>
									<Avatar
										alt={member.name}
										className='flex-shrink-0'
										size='sm'
										src={`https://i.pravatar.cc/40?u=${member.user_id}`} // Placeholder avatar
									/>
									<div className='flex flex-col'>
										<span className='text-small'>{member.name}</span>
										<span className='text-tiny text-default-400'>{member.email}</span>
									</div>
								</div>
							</ListboxItem>
						))}
					</Listbox>
				</div>
			</PopoverContent>
		</Popover>
	);
}
