import React, { useState } from "react";
import type { Task, StatusTask } from "@/src/types/task";
import type { ProjectMember, ProjectRole } from "@/src/types/project";
import { ChevronRight, Plus } from "lucide-react";
import AssignTaskPopover from "./AssignTaskPopover";
import {
	Button,
	Tooltip,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
} from "@heroui/react";
import { useAuth } from "@/src/context/AuthContext";
import { taskService } from "@/src/services/taskService";
import { StatusDisplay, EditableDate } from "./InlineEditComponents";

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
	const { token } = useAuth();
	const [isExpanded, setIsExpanded] = useState(true);

	const hasSubtasks = task.sub_tasks && task.sub_tasks.length > 0;
	const canEdit = userProjectRole === "owner";

	const handleUpdateTask = async (
		updates: Partial<Pick<Task, "status" | "priority" | "due_date">>
	) => {
		if (!token) return;
		try {
			// Menggunakan PUT /v1/tasks/{task_id} untuk semua update
			// Kita kirim data yang ada ditambah data yang baru
			const payload = {
				name: task.name,
				...Object.fromEntries(
					Object.entries(updates).filter(([_, value]) => value !== null)
				),
			};
			await taskService.updateTask(token, task.id, payload);
			onUpdate();
		} catch (error) {
			console.error("Gagal memperbarui tugas:", error);
		}
	};

	return (
		<React.Fragment>
			<tr className='hover:bg-gray-50 group'>
				{/* Kolom Nama & Checkbox */}
				<td className='py-2 px-6 whitespace-nowrap'>
					<div className={`flex items-center gap-2 pl-[${level * 24}px]`}>
						{hasSubtasks ? (
							<Button
								isIconOnly
								size='sm'
								variant='light'
								onPress={() => setIsExpanded(!isExpanded)}
								className='-ml-2'
								aria-label={isExpanded ? "Sembunyikan subtugas" : "Tampilkan subtugas"}>
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
				{/* Kolom Status */}
				<td className='py-2 px-6 whitespace-nowrap'>
					<StatusDisplay
						status={task.status || "pending"}
						userProjectRole={userProjectRole}
						onChange={(newStatus) => handleUpdateTask({ status: newStatus })}
					/>
				</td>
				{/* Kolom Penerima Tugas */}
				<td className='py-2 px-6 whitespace-nowrap'>
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
										src={
											assignee.profile_url ||
											`https://i.pravatar.cc/32?u=${assignee.user_id}`
										}
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
				{/* Kolom Tenggat */}
				<td className='py-2 px-6 whitespace-nowrap'>
					<EditableDate
						date={task.due_date}
						canEdit={canEdit}
						onSave={(newDate) => handleUpdateTask({ due_date: newDate })}
					/>
				</td>
				{/* Kolom Prioritas */}
				<td className='py-2 px-6 whitespace-nowrap'>
					<Dropdown isDisabled={!canEdit}>
						<DropdownTrigger>
							<Button size='sm' variant='light' className='-ml-3 text-sm'>
								{task.priority || "Pilih"}
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							aria-label='Ubah Prioritas'
							onAction={(key) => handleUpdateTask({ priority: key as any })}>
							<DropdownItem key='low'>Rendah</DropdownItem>
							<DropdownItem key='medium'>Sedang</DropdownItem>
							<DropdownItem key='high'>Tinggi</DropdownItem>
						</DropdownMenu>
					</Dropdown>
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
