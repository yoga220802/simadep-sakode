"use client";
import Image from "next/image";
import type { ProjectMember } from "@/src/types/project";
import type { Task } from "@/src/types/task";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
	Listbox,
	ListboxItem,
	Avatar,
	Chip,
} from "@heroui/react";
import type { Key } from "react";

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

	const handleSelection = (key: Key) => {
		// FIX: Konversi key ke number dan pastikan member ditemukan
		const selectedUserId = Number(key);
		const member = projectMembers.find((m) => m.user_id === selectedUserId);

		if (!member) {
			console.error("Member tidak ditemukan!");
			return;
		}

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
						onAction={handleSelection}>
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
									<div className='relative w-8 h-8 flex-shrink-0'>
										{" "}
										<Image
											alt={member.name}
											className='rounded-full'
											layout='fill'
											objectFit='cover'
											unoptimized={true}
											src={
												member.profile_url ||
												`https://randomuser.me/api/portraits/lego/${member.user_id % 9}.jpg`
											}
											onError={(
												e // Fallback jika image gagal load
											) =>
												(e.currentTarget.src = `https://placehold.co/32x32/E4E7EC/667085?text=${member.name.charAt(
													0
												)}`)
											}
										/>
									</div>
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
