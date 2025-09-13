import React, { useState, useMemo } from "react";
import type { Task, StatusTask, TaskUpdatePayload } from "@/src/types/task";
import type { ProjectMember, ProjectRole } from "@/src/types/project";
import type { Category } from "@/src/types/category";
import { ChevronRight, Plus, Tag, Trash2 } from "lucide-react";
import AssignTaskPopover from "./AssignTaskPopover";
import AssignCategoryPopover from "./AssignCategoryPopover";
import { Button, Tooltip } from "@heroui/react";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext";
import { taskService } from "@/src/services/taskService";
import { StatusDisplay, EditableDate } from "./InlineEditComponents";
import Image from "next/image";
import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
} from "@heroui/react";

interface TaskRowProps {
	task: Task;
	projectMembers: ProjectMember[];
	categories: Category[];
	userProjectRole: ProjectRole;
	onAssign: (taskId: number, userId: number) => void;
	onUnassign: (taskId: number, userId: number) => void;
	onCategoryChange: (taskId: number, categoryId: number | null) => void;
	onUpdate: () => void;
	onSubtaskCreate: (parentTask: Task) => void;
	onTaskEdit: (task: Task) => void;
	onTaskDelete: (task: Task) => void; // Tambah prop onTaskDelete
	level?: number;
}

export default function TaskRow({
	task,
	projectMembers,
	categories,
	userProjectRole,
	onAssign,
	onUnassign,
	onCategoryChange,
	onUpdate,
	onSubtaskCreate,
	onTaskEdit,
	onTaskDelete, // Terima prop
	level = 0,
}: TaskRowProps) {
	const { token } = useAuth();
	const { showToast } = useAppToast();
	const [isExpanded, setIsExpanded] = useState(true);

	const hasSubtasks = task.sub_tasks && task.sub_tasks.length > 0;
	const canEdit = userProjectRole === "owner";

	const assignedCategory = useMemo(
		() => categories.find((cat) => cat.id === task.category_id),
		[categories, task.category_id]
	);

	const handleUpdateTask = async (updates: Partial<TaskUpdatePayload>) => {
		if (!token) return;

		let updatePromise: Promise<Task>;
		let loadingTitle = "Memperbarui tugas...";
		let successDesc = "Tugas berhasil diperbarui.";
		let errorPrefix = "Gagal memperbarui tugas";

		if (
			userProjectRole === "contributor" &&
			updates.status &&
			Object.keys(updates).length === 1
		) {
			updatePromise = taskService.updateTaskStatus(token, task.id, updates.status);
			loadingTitle = "Memperbarui status tugas...";
			successDesc = "Status tugas berhasil diperbarui.";
			errorPrefix = "Gagal memperbarui status";
		} else if (userProjectRole === "owner") {
			const payload: TaskUpdatePayload = {
				name: task.name,
				description: task.description || undefined,
				status: task.status || undefined,
				priority: task.priority || undefined,
				due_date: task.due_date || undefined,
				start_date: task.start_date || undefined,
				category_id: task.category_id || undefined,
				...updates,
			};
			updatePromise = taskService.updateTask(token, task.id, payload);
		} else {
			showToast("Anda tidak memiliki izin untuk melakukan aksi ini.", "error");
			return;
		}

		showToast(updatePromise, {
			loading: loadingTitle,
			success: () => {
				onUpdate();
				return successDesc;
			},
			error: (err: Error) => `${errorPrefix}: ${err.message}`,
		});
	};

	const cellPadding = { paddingLeft: `${level * 24}px` };

	return (
		<React.Fragment>
			<tr className='hover:bg-gray-50 group'>
				<td className='py-2 px-6 whitespace-nowrap' style={cellPadding}>
					<div className={`flex items-center gap-2`}>
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
							<div className='w-6 flex-shrink-0'></div>
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
				<td className='py-2 px-6 whitespace-nowrap'>
					<StatusDisplay
						status={task.status || "pending"}
						userProjectRole={userProjectRole}
						onChange={(newStatus) => handleUpdateTask({ status: newStatus })}
					/>
				</td>
				<td className='py-2 px-6 whitespace-nowrap'>
					<AssignCategoryPopover
						taskId={task.id}
						categories={categories}
						selectedCategoryId={task.category_id}
						onCategoryChange={onCategoryChange}
						canEdit={canEdit}>
						<Button
							size='sm'
							variant='light'
							className='-ml-3 text-sm text-gray-600'
							startContent={<Tag size={14} />}>
							{assignedCategory?.name || "Pilih Kategori"}
						</Button>
					</AssignCategoryPopover>
				</td>
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
									<Image
										src={
											assignee.profile_url ||
											`https://i.pravatar.cc/32?u=${assignee.user_id}`
										}
										alt={assignee.name}
										width={32}
										height={32}
										unoptimized = {true}
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
				<td className='py-2 px-6 whitespace-nowrap'>
					<EditableDate
						date={task.due_date}
						canEdit={canEdit}
						onSave={(newDate) => handleUpdateTask({ due_date: newDate || undefined })}
					/>
				</td>
				<td className='py-2 px-6 whitespace-nowrap'>
					<Dropdown isDisabled={!canEdit}>
						<DropdownTrigger>
							<Button
								size='sm'
								variant='light'
								className={`-ml-3 text-sm w-full ${
									task.priority === "low"
										? "bg-green-600/30 text-green-600"
										: task.priority === "medium"
										? "bg-blue-600/30 text-blue-600"
										: task.priority === "high"
										? "bg-red-600/30 text-red-600"
										: "bg-gray-600/30 text-gray-600"
								}`}>
								<strong>{task.priority || "Pilih"}</strong>
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							aria-label='Ubah Prioritas'
							onAction={(key) =>
								handleUpdateTask({ priority: key as "low" | "medium" | "high" })
							}>
							<DropdownItem key='low'>Rendah</DropdownItem>
							<DropdownItem key='medium'>Sedang</DropdownItem>
							<DropdownItem key='high'>Tinggi</DropdownItem>
						</DropdownMenu>
					</Dropdown>
				</td>
				<td className='py-2 px-6 whitespace-nowrap'>
					{canEdit && (
						<Tooltip content='Hapus Tugas' color='danger'>
							<Button
								isIconOnly
								size='sm'
								variant='light'
								color='danger'
								className='opacity-0 group-hover:opacity-100'
								onPress={() => onTaskDelete(task)}>
								<Trash2 size={16} />
							</Button>
						</Tooltip>
					)}
				</td>
			</tr>
			{isExpanded &&
				task.sub_tasks?.map((subtask) => (
					<TaskRow
						key={subtask.id}
						task={subtask}
						projectMembers={projectMembers}
						categories={categories}
						userProjectRole={userProjectRole}
						onAssign={onAssign}
						onUnassign={onUnassign}
						onCategoryChange={onCategoryChange}
						onUpdate={onUpdate}
						onSubtaskCreate={onSubtaskCreate}
						onTaskEdit={onTaskEdit}
						onTaskDelete={onTaskDelete} // Kirim prop ke subtugas
						level={level + 1}
					/>
				))}
		</React.Fragment>
	);
}
