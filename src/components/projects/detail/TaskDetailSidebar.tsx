"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext";
import { taskService } from "@/src/services/taskService";
import { commentService } from "@/src/services/commentService";
import { attachmentService } from "@/src/services/attachmentService";
import type { Task, TaskUpdatePayload, PriorityLevel } from "@/src/types/task";
import type { Comment } from "@/src/types/comment";
import type { ProjectMember, ProjectRole } from "@/src/types/project";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	Button,
	Textarea,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
} from "@heroui/react";
import {
	X,
	LoaderCircle,
	Users,
	File,
	Calendar,
	BarChart,
	Circle,
	ListTodo,
	MessageSquare,
	Pencil,
	Plus,
} from "lucide-react";
import DetailItem from "./sidebar/DetailItem";
import AttachmentItem from "./sidebar/AttachmentItem";
import CommentItem from "./sidebar/CommentItem";
import CommentInput from "./sidebar/CommentInput";
import AssignTaskPopover from "./AssignTaskPopover";
import { EditableDate, StatusDisplay } from "./InlineEditComponents";

interface TaskDetailSidebarProps {
	taskId: number | null;
	isOpen: boolean;
	onClose: () => void;
	onUpdate: () => void;
	projectMembers: ProjectMember[];
	userProjectRole: ProjectRole;
}

const priorityOptions: { value: PriorityLevel; label: string }[] = [
	{ value: "low", label: "Rendah" },
	{ value: "medium", label: "Sedang" },
	{ value: "high", label: "Tinggi" },
];

export default function TaskDetailSidebar({
	taskId,
	isOpen,
	onClose,
	onUpdate,
	projectMembers,
	userProjectRole,
}: TaskDetailSidebarProps) {
	const { user, token } = useAuth();
	const { showToast } = useAppToast();
	const [task, setTask] = useState<Task | null>(null);
	const [comments, setComments] = useState<Comment[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isEditingDesc, setIsEditingDesc] = useState(false);
	const [newDesc, setNewDesc] = useState("");

	const canEdit =
		userProjectRole === "owner" || userProjectRole === "contributor";

	const fetchTaskData = useCallback(async () => {
		if (!token || !taskId) return;
		setIsLoading(true);
		setError(null);
		try {
			const [taskData, commentsData] = await Promise.all([
				taskService.getTaskById(token, taskId),
				commentService.getComments(token, taskId),
			]);
			setTask(taskData);
			setComments(commentsData);
			setNewDesc(taskData.description || "");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal memuat detail tugas.");
		} finally {
			setIsLoading(false);
		}
	}, [token, taskId]);

	useEffect(() => {
		if (isOpen && taskId) {
			fetchTaskData();
		} else {
			setTask(null);
		}
	}, [isOpen, taskId, fetchTaskData]);

	const handleUpdateTask = (updates: Partial<TaskUpdatePayload>) => {
		if (!token || !task) return;

		const payload = {
			name: task.name,
			...updates,
		};
		const promise = taskService.updateTask(token, task.id, payload);

		showToast(promise, {
			loading: "Memperbarui tugas...",
			success: () => "Tugas berhasil diperbarui.",
			error: (err: Error) => `Gagal memperbarui tugas: ${err.message}`,
		});
	};

	const handleAssign = async (taskId: number, userId: number) => {
		if (!token || !task) return;
		const member = projectMembers.find((m) => m.user_id === userId);
		if (!member) return;

		const promise = taskService.assignTask(token, taskId, userId);
		showToast(promise, {
			loading: `Menugaskan ${member.name}...`,
			success: () => {
				console.log(`Berhasil menugaskan ${member.name} ke task ${task.name}.`);
				setTask((prev) =>
					prev ? { ...prev, assignees: [...(prev.assignees || []), member] } : prev
				);
				return `${member.name} berhasil ditugaskan ke "${task.name}".`;
			},
			error: (err: Error) => {
				console.error(`Gagal menugaskan ${member.name}: ${err.message}`);
				return `Gagal menugaskan ${member.name}: ${err.message}`;
			},
		});
	};

	const handleUnassign = async (taskId: number, userId: number) => {
		if (!token || !task) return;
		const member = projectMembers.find((m) => m.user_id === userId);
		if (!member) return;

		const promise = taskService.unassignTask(token, taskId, userId);
		showToast(promise, {
			loading: `Melepas penugasan ${member.name}...`,
			success: () => {
				console.log(
					`Berhasil melepas penugasan ${member.name} dari task ${task.name}.`
				);
				setTask((prev) =>
					prev
						? {
								...prev,
								assignees: prev.assignees?.filter((a) => a.user_id !== userId),
						  }
						: prev
				);
				return `Penugasan ${member.name} berhasil dilepas.`;
			},
			error: (err: Error) => {
				console.error(`Gagal melepas penugasan ${member.name}: ${err.message}`);
				return `Gagal melepas penugasan: ${err.message}`;
			},
		});
	};

	const handleUploadAttachment = async (file: File) => {
		if (!token || !task) return;
		const promise = attachmentService.uploadForTask(token, task.id, file);
		showToast(promise, {
			loading: `Mengunggah ${file.name}...`,
			success: () => "Lampiran berhasil diunggah.",
			error: (err: Error) => `Gagal mengunggah lampiran: ${err.message}`,
		});
	};

	const handleDeleteAttachment = (attachmentId: number, fileName: string) => {
		if (!token || !task) return;
		const promise = attachmentService.deleteAttachment(token, attachmentId);
		showToast(promise, {
			loading: `Menghapus ${fileName}...`,
			success: () => "Lampiran berhasil dihapus.",
			error: (err: Error) => `Gagal menghapus lampiran: ${err.message}`,
		});
	};

	const handleCreateComment = async (content: string, files: File[]) => {
		if (!token || !task) return;
		const promise = commentService
			.createComment(token, {
				task_id: task.id,
				content,
			})
			.then(async (newComment) => {
				if (files.length > 0) {
					await Promise.all(
						files.map((file) =>
							attachmentService.uploadForComment(token, newComment.id, file)
						)
					);
				}
				return newComment;
			});

		showToast(promise, {
			loading: "Mengirim komentar...",
			success: () => "Komentar berhasil ditambahkan.",
			error: (err: Error) => `Gagal membuat komentar: ${err.message}`,
		});
	};

	const handleDeleteComment = async (commentId: number) => {
		if (!token || !task) return;
		const promise = commentService.deleteComment(token, task.id, commentId);
		showToast(promise, {
			loading: "Menghapus komentar...",
			success: () => "Komentar berhasil dihapus.",
			error: (err: Error) => `Gagal menghapus komentar: ${err.message}`,
		});
	};

	const currentPriority = useMemo(
		() => priorityOptions.find((p) => p.value === task?.priority) || null,
		[task]
	);

	const assignableMembers = projectMembers.filter(
		(m) => m.project_role === "contributor"
	);

	return (
		<Drawer isOpen={isOpen} onClose={onClose} placement='right'>
			<DrawerContent className='w-[500px] sm:w-[600px] bg-white p-0'>
				{isLoading && (
					<div className='flex items-center justify-center h-full'>
						<LoaderCircle className='w-10 h-10 animate-spin text-primary' />
					</div>
				)}
				{error && <div className='p-6 text-red-500'>{error}</div>}
				{!isLoading && !error && task && (
					<div className='flex flex-col h-full'>
						<DrawerHeader className='p-6 border-b'>
							<div className='flex justify-between items-start'>
								<h2 className='text-2xl font-bold'>{task.name}</h2>
								<Button
									isIconOnly
									variant='light'
									size='sm'
									onPress={onClose}
									className='-mt-2'>
									<X className='h-6 w-6' />
								</Button>
							</div>
						</DrawerHeader>

						<div className='flex-1 overflow-y-auto p-6 space-y-8'>
							{/* Details Section */}
							<div className='space-y-4'>
								<DetailItem icon={Users} label='Penerima'>
									<AssignTaskPopover
										task={task}
										projectMembers={assignableMembers}
										onAssign={handleAssign}
										onUnassign={handleUnassign}>
										<div className='flex flex-wrap gap-2 items-center cursor-pointer'>
											{task.assignees?.map((a) => (
												<div key={a.user_id} className='text-sm'>
													{a.name}
												</div>
											))}
											{canEdit && (
												<div className='w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center hover:bg-gray-200'>
													<Plus size={16} className='text-gray-500' />
												</div>
											)}
										</div>
									</AssignTaskPopover>
								</DetailItem>
								<DetailItem icon={Calendar} label='Tenggat'>
									<EditableDate
										date={task.due_date}
										canEdit={canEdit}
										onSave={(newDate) => handleUpdateTask({ due_date: newDate })}
									/>
								</DetailItem>
								<DetailItem icon={BarChart} label='Prioritas'>
									<Dropdown isDisabled={!canEdit}>
										<DropdownTrigger>
											<Button size='sm' variant='light'>
												{currentPriority?.label || "Pilih Prioritas"}
											</Button>
										</DropdownTrigger>
										<DropdownMenu
											aria-label='Ubah Prioritas'
											selectionMode='single'
											selectedKeys={task.priority ? [task.priority] : []}
											onAction={(key) =>
												handleUpdateTask({ priority: key as PriorityLevel })
											}>
											{priorityOptions.map((opt) => (
												<DropdownItem key={opt.value}>{opt.label}</DropdownItem>
											))}
										</DropdownMenu>
									</Dropdown>
								</DetailItem>
								<DetailItem icon={Circle} label='Status'>
									<StatusDisplay
										status={task.status || "pending"}
										userProjectRole={userProjectRole}
										onChange={(newStatus) => handleUpdateTask({ status: newStatus })}
									/>
								</DetailItem>
								{task.sub_tasks && task.sub_tasks.length > 0 && (
									<DetailItem icon={ListTodo} label='Sub-Tugas'>
										<div className='space-y-1'>
											{task.sub_tasks.map((sub) => (
												<div key={sub.id} className='text-sm text-gray-800'>
													- {sub.name}
												</div>
											))}
										</div>
									</DetailItem>
								)}
							</div>

							{/* Description Section */}
							<div className='space-y-2'>
								<div className='flex justify-between items-center'>
									<h3 className='font-bold text-lg'>Deskripsi</h3>
									{canEdit && !isEditingDesc && (
										<Button
											isIconOnly
											size='sm'
											variant='light'
											onPress={() => setIsEditingDesc(true)}>
											<Pencil size={16} />
										</Button>
									)}
								</div>
								{isEditingDesc ? (
									<div>
										<Textarea value={newDesc} onValueChange={setNewDesc} minRows={4} />
										<div className='flex gap-2 justify-end mt-2'>
											<Button
												size='sm'
												variant='light'
												onPress={() => setIsEditingDesc(false)}>
												Batal
											</Button>
											<Button
												size='sm'
												color='primary'
												className='bg-primary text-white'
												onPress={() => {
													handleUpdateTask({ description: newDesc });
													setIsEditingDesc(false);
												}}>
												Simpan
											</Button>
										</div>
									</div>
								) : (
									<p className='text-gray-600 whitespace-pre-wrap'>
										{task.description || "Tidak ada deskripsi."}
									</p>
								)}
							</div>

							{/* Attachments Section */}
							<div className='space-y-2'>
								<h3 className='font-bold text-lg'>Lampiran</h3>
								<div className='space-y-2'>
									{task.attachments?.map((att) => (
										<AttachmentItem
											key={att.id}
											attachment={att}
											onDelete={() => handleDeleteAttachment(att.id, att.file_name)}
											canDelete={canEdit}
										/>
									))}
								</div>
								{canEdit && (
									<label className='cursor-pointer text-sm text-primary hover:underline'>
										+ Tambah Lampiran
										<input
											type='file'
											className='hidden'
											onChange={(e) =>
												e.target.files && handleUploadAttachment(e.target.files[0])
											}
										/>
									</label>
								)}
							</div>

							{/* Comments Section */}
							<div className='space-y-4'>
								<h3 className='font-bold text-lg'>Komentar</h3>
								<div className='space-y-6'>
									{comments.map((comment) => (
										<CommentItem
											key={comment.id}
											comment={comment}
											projectMembers={projectMembers}
											onDelete={handleDeleteComment}
											canDelete={
												userProjectRole === "owner" ||
												comment.user_id.toString() === user?.id
											}
										/>
									))}
								</div>
								<CommentInput taskId={task.id} onSubmit={handleCreateComment} />
							</div>
						</div>
					</div>
				)}
			</DrawerContent>
		</Drawer>
	);
}
