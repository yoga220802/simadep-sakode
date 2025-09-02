"use client";

import { useState } from "react";
import type { Task } from "@/src/types/task";
import type { ProjectMember, ProjectRole } from "@/src/types/project";
import { ChevronDown, Plus, MoreHorizontal, Check, X } from "lucide-react";
import TaskRow from "./TaskRow";
import DeleteConfirmationModal from "../../common/DeleteConfirmationModal";
import {
	Button,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Input,
	useDisclosure,
} from "@heroui/react";
import { useAuth } from "@/src/context/AuthContext";
import { taskService } from "@/src/services/taskService";

interface MilestoneGroupProps {
	milestone: Task;
	projectMembers: ProjectMember[];
	userProjectRole: ProjectRole;
	onUpdate: () => void;
	onAssign: (taskId: number, userId: number) => void;
	onUnassign: (taskId: number, userId: number) => void;
	onSubtaskCreate: (parentTask: Task) => void;
	onTaskSelect: (task: Task | null) => void;
}

export default function MilestoneGroup({
	milestone,
	projectMembers,
	userProjectRole,
	onUpdate,
	onAssign,
	onUnassign,
	onSubtaskCreate,
	onTaskSelect,
}: MilestoneGroupProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [editedName, setEditedName] = useState(milestone.name);
	const { token } = useAuth();

	const {
		isOpen: isDeleteModalOpen,
		onOpen: onDeleteModalOpen,
		onClose: onDeleteModalClose,
	} = useDisclosure();

	const handleAddTask = () => {
		onSubtaskCreate(milestone);
	};

	const handleSaveEdit = async () => {
		if (!token || editedName.trim() === "" || editedName === milestone.name) {
			setIsEditing(false);
			setEditedName(milestone.name);
			return;
		}
		try {
			await taskService.updateTask(token, milestone.id, { name: editedName });
			onUpdate();
		} catch (error) {
			console.error("Gagal update nama milestone:", error);
			setEditedName(milestone.name);
		} finally {
			setIsEditing(false);
		}
	};

	const handleCancelEdit = () => {
		setEditedName(milestone.name);
		setIsEditing(false);
	};

	const confirmDeleteMilestone = async () => {
		if (!token) return;
		setIsDeleting(true);
		try {
			await taskService.deleteTask(token, milestone.id);
			onDeleteModalClose();
			onUpdate();
		} catch (error) {
			console.error("Gagal menghapus milestone:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	const canEdit = userProjectRole === "owner";

	return (
		<>
			<div className='mb-8'>
				<div className='flex items-center justify-between mb-2'>
					<div className='flex items-center gap-2 flex-grow min-w-0'>
						<button
							onClick={() => setIsOpen(!isOpen)}
							className='p-1 flex-shrink-0'
							title={isOpen ? "Tutup" : "Buka"}>
							<ChevronDown
								size={24}
								className={`transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
							/>
						</button>
						{isEditing && canEdit ? (
							<div className='flex items-center gap-2 w-full'>
								<Input
									value={editedName}
									onValueChange={setEditedName}
									autoFocus
									onKeyDown={(e) => {
										if (e.key === "Enter") handleSaveEdit();
										if (e.key === "Escape") handleCancelEdit();
									}}
									classNames={{
										input: "text-xl font-bold !p-0 border-none focus:ring-0",
										inputWrapper: "h-auto p-1 shadow-none bg-gray-100",
									}}
								/>
								<Button isIconOnly size='sm' variant='light' onPress={handleSaveEdit}>
									<Check size={20} className='text-green-500' />
								</Button>
								<Button isIconOnly size='sm' variant='light' onPress={handleCancelEdit}>
									<X size={20} className='text-red-500' />
								</Button>
							</div>
						) : (
							<h3 className='text-xl font-bold text-gray-800 truncate'>
								{milestone.name}
							</h3>
						)}
					</div>

					{canEdit && !isEditing && (
						<div className='flex-shrink-0'>
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
								<DropdownMenu
									aria-label='Milestone Actions'
									onAction={(key) => {
										if (key === "edit") setIsEditing(true);
										if (key === "delete") onDeleteModalOpen();
									}}>
									<DropdownItem key='edit'>Edit Milestone</DropdownItem>
									<DropdownItem key='delete' className='text-danger' color='danger'>
										Hapus Milestone
									</DropdownItem>
								</DropdownMenu>
							</Dropdown>
						</div>
					)}
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
										onUpdate={onUpdate}
										onAssign={onAssign}
										onUnassign={onUnassign}
										onTaskSelect={onTaskSelect}
										onSubtaskCreate={onSubtaskCreate}
										userProjectRole={userProjectRole} // Added userProjectRole prop
									/>
								))}
								{(!milestone.sub_tasks || milestone.sub_tasks.length === 0) && (
									<tr>
										<td colSpan={4} className='text-center py-4 text-gray-500'>
											Belum ada tugas di milestone ini.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				)}
			</div>
			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={onDeleteModalClose}
				onConfirm={confirmDeleteMilestone}
				isLoading={isDeleting}
				itemName={milestone.name}
				itemType='milestone'
			/>
		</>
	);
}
