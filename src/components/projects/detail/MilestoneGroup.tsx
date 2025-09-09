"use client";

import { useState } from "react";
import type { Milestone, Task } from "@/src/types/task";
import type { ProjectMember, ProjectRole } from "@/src/types/project";
import {
	ChevronDown,
	Plus,
	MoreHorizontal,
	Check,
	X,
	Pencil,
	Trash2,
} from "lucide-react";
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
	milestone: Milestone;
	projectMembers: ProjectMember[];
	userProjectRole: ProjectRole;
	onUpdate: () => void;
	onAssign: (taskId: number, userId: number) => void;
	onUnassign: (taskId: number, userId: number) => void;
	onTaskCreate: (milestone: Milestone) => void;
	onSubtaskCreate: (parentTask: Task) => void;
	onTaskEdit: (task: Task) => void;
}

export default function MilestoneGroup({
	milestone,
	projectMembers,
	userProjectRole,
	onUpdate,
	onAssign,
	onUnassign,
	onTaskCreate,
	onSubtaskCreate,
	onTaskEdit,
}: MilestoneGroupProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [editedName, setEditedName] = useState(milestone.title);
	const { token } = useAuth();

	const {
		isOpen: isDeleteModalOpen,
		onOpen: onDeleteModalOpen,
		onClose: onDeleteModalClose,
	} = useDisclosure();

	const handleSaveEdit = async () => {
		if (!token || editedName.trim() === "" || editedName === milestone.title) {
			setIsEditing(false);
			setEditedName(milestone.title);
			return;
		}
		try {
			await taskService.updateMilestone(token, milestone.id, {
				title: editedName,
			});
			onUpdate();
		} catch (error) {
			console.error("Gagal update nama milestone:", error);
			setEditedName(milestone.title);
		} finally {
			setIsEditing(false);
		}
	};

	const handleCancelEdit = () => {
		setEditedName(milestone.title);
		setIsEditing(false);
	};

	const confirmDeleteMilestone = async () => {
		if (!token) return;
		setIsDeleting(true);
		try {
			await taskService.deleteMilestone(token, milestone.id);
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
						<Button
							isIconOnly
							variant='light'
							size='sm'
							onPress={() => setIsOpen(!isOpen)}
							aria-label={isOpen ? "Tutup" : "Buka"}>
							<ChevronDown
								size={24}
								className={`transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}
							/>
						</Button>
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
								{milestone.title}
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
								onPress={() => onTaskCreate(milestone)}>
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
									<DropdownItem key='edit' startContent={<Pencil size={16} />}>
										Edit Milestone
									</DropdownItem>
									<DropdownItem
										key='delete'
										className='text-danger'
										color='danger'
										startContent={<Trash2 size={16} />}>
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
										Status
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
								{milestone.tasks?.map((task) => (
									<TaskRow
										key={task.id}
										task={task}
										projectMembers={projectMembers}
										userProjectRole={userProjectRole}
										onUpdate={onUpdate}
										onAssign={onAssign}
										onUnassign={onUnassign}
										onSubtaskCreate={onSubtaskCreate}
										onTaskEdit={onTaskEdit}
									/>
								))}
								{(!milestone.tasks || milestone.tasks.length === 0) && (
									<tr>
										<td colSpan={5} className='text-center py-4 text-gray-500'>
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
				itemName={milestone.title}
				itemType='milestone'
			/>
		</>
	);
}
