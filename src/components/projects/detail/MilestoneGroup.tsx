"use client";

import { useState } from "react";
import type { Milestone, Task } from "@/src/types/task";
import type { ProjectMember, ProjectRole } from "@/src/types/project";
import type { Category } from "@/src/types/category";
import { ChevronDown, Plus, Check, X, Pencil, Trash2 } from "lucide-react";
import TaskRow from "./TaskRow";
import DeleteConfirmationModal from "../../common/DeleteConfirmationModal";
import { Button, Input, useDisclosure } from "@heroui/react";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext";
import { taskService } from "@/src/services/taskService";

interface MilestoneGroupProps {
	milestone: Milestone;
	projectMembers: ProjectMember[];
	categories: Category[];
	userProjectRole: ProjectRole;
	onUpdate: () => void;
	onAssign: (taskId: number, userId: number) => void;
	onUnassign: (taskId: number, userId: number) => void;
	onCategoryChange: (taskId: number, categoryId: number | null) => void;
	onTaskCreate: (milestone: Milestone) => void;
	onSubtaskCreate: (parentTask: Task) => void;
	onTaskEdit: (task: Task) => void;
	onTaskDelete: (task: Task) => void; // Tambahkan prop baru
}

export default function MilestoneGroup({
	milestone,
	projectMembers,
	categories,
	userProjectRole,
	onUpdate,
	onAssign,
	onUnassign,
	onCategoryChange,
	onTaskCreate,
	onSubtaskCreate,
	onTaskEdit,
	onTaskDelete, // Terima prop baru
}: MilestoneGroupProps) {
	const [isOpen, setIsOpen] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [editedName, setEditedName] = useState(milestone.title);
	const { token } = useAuth();
	const { showToast } = useAppToast();

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

		const editPromise = taskService.updateMilestone(token, milestone.id, {
			title: editedName,
		});

		showToast(editPromise, {
			loading: "Menyimpan nama milestone...",
			success: (result: unknown) => {
				const updatedMilestone = result as Milestone;
				onUpdate();
				setIsEditing(false);
				return `Nama milestone berhasil diubah menjadi "${updatedMilestone.title}".`;
			},
			error: (err: Error) => {
				setEditedName(milestone.title);
				return `Gagal memperbarui milestone: ${err.message}`;
			},
		});
	};

	const handleCancelEdit = () => {
		setEditedName(milestone.title);
		setIsEditing(false);
	};

	const confirmDeleteMilestone = async () => {
		if (!token) return;

		const deletePromise = taskService.deleteMilestone(token, milestone.id);

		showToast(deletePromise, {
			loading: `Menghapus milestone "${milestone.title}"...`,
			success: () => {
				onUpdate();
				onDeleteModalClose();
				return "Milestone berhasil dihapus.";
			},
			error: (err: Error) => `Gagal menghapus milestone: ${err.message}`,
		});
	};

	const canEdit = userProjectRole === "owner";

	return (
		<>
			<div className='mb-8'>
				<div className='flex items-center justify-between mb-2 group'>
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
							<div className='flex items-center gap-1'>
								<h3 className='text-xl font-bold text-gray-800 truncate'>
									{milestone.title}
								</h3>
								{canEdit && (
									<Button
										isIconOnly
										variant='light'
										size='sm'
										className='opacity-0 group-hover:opacity-100 transition-opacity'
										onPress={() => setIsEditing(true)}>
										<Pencil size={16} />
									</Button>
								)}
							</div>
						)}
					</div>

					{canEdit && !isEditing && (
						<div className='flex-shrink-0 flex items-center gap-1'>
							<Button
								isIconOnly
								variant='light'
								size='sm'
								onPress={() => onTaskCreate(milestone)}>
								<Plus size={18} />
							</Button>
							<Button
								isIconOnly
								variant='light'
								size='sm'
								color='danger'
								onPress={onDeleteModalOpen}>
								<Trash2 size={16} />
							</Button>
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
										Kategori
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
									<th className='py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
										Aksi
									</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-200'>
								{milestone.tasks?.map((task) => (
									<TaskRow
										key={task.id}
										task={task}
										projectMembers={projectMembers}
										categories={categories}
										userProjectRole={userProjectRole}
										onUpdate={onUpdate}
										onAssign={onAssign}
										onUnassign={onUnassign}
										onCategoryChange={onCategoryChange}
										onSubtaskCreate={onSubtaskCreate}
										onTaskEdit={onTaskEdit}
										onTaskDelete={onTaskDelete} // Kirim prop ke TaskRow
									/>
								))}
								{(!milestone.tasks || milestone.tasks.length === 0) && (
									<tr>
										<td colSpan={7} className='text-center py-4 text-gray-500'>
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
				isLoading={false}
				itemName={milestone.title}
				itemType='milestone'
			/>
		</>
	);
}
