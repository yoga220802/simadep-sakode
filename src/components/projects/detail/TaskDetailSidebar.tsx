"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext";
import { taskService } from "@/src/services/taskService";
import { commentService } from "@/src/services/commentService";
import { attachmentService } from "@/src/services/attachmentService";
import type { Task, TaskUpdatePayload, PriorityLevel } from "@/src/types/task";
import type { Comment } from "@/src/types/comment";
import type { AttachmentLinkCreate } from "@/src/types/attachment";
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
	Input,
} from "@heroui/react";
import {
	X,
	LoaderCircle,
	Users,
	Calendar,
	BarChart,
	Circle,
	ListTodo,
	MessageSquare,
	Pencil,
	Plus,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import DetailItem from "./sidebar/DetailItem";
import AttachmentItem from "./sidebar/AttachmentItem";
import CommentItem from "./sidebar/CommentItem";
import CommentInput from "./sidebar/CommentInput";
import AssignTaskPopover from "./AssignTaskPopover";
import { EditableDate, StatusDisplay } from "./InlineEditComponents";
import AddAttachmentPopover from "./sidebar/AddAttachmentPopover";

interface TaskDetailSidebarProps {
	taskId: number | null;
	isOpen: boolean;
	onClose: () => void;
	onUpdate: () => void;
	projectMembers: ProjectMember[];
	userProjectRole: ProjectRole;
	onSubtaskCreate: (parentTask: Task) => void;
}

const priorityConfig: Record<
	PriorityLevel,
	{ label: string; color: string; dotColor: string }
> = {
	low: {
		label: "Rendah",
		color: "bg-green-100 text-green-800",
		dotColor: "bg-green-500",
	},
	medium: {
		label: "Sedang",
		color: "bg-blue-100 text-blue-800",
		dotColor: "bg-blue-500",
	},
	high: {
		label: "Tinggi",
		color: "bg-red-100 text-red-800",
		dotColor: "bg-red-500",
	},
};

const COMMENT_POLLING_INTERVAL = 5000;

export default function TaskDetailSidebar({
	taskId,
	isOpen,
	onClose,
	onUpdate,
	projectMembers,
	userProjectRole,
	onSubtaskCreate,
}: TaskDetailSidebarProps) {
	const { user, token } = useAuth();
	const { showToast } = useAppToast();
	const [taskStack, setTaskStack] = useState<Task[]>([]);
	const [comments, setComments] = useState<Comment[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isEditingDesc, setIsEditingDesc] = useState(false);
	const [newDesc, setNewDesc] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const currentTask =
		taskStack.length > 0 ? taskStack[taskStack.length - 1] : null;
	const canEdit =
		userProjectRole === "owner" || userProjectRole === "contributor";

	const handleNavigateToTask = useCallback(
		async (idToFetch: number, isReset = false) => {
			if (!token) return;
			setIsLoading(true);
			setError(null);
			try {
				const [taskData, commentsData] = await Promise.all([
					taskService.getTaskById(token, idToFetch),
					commentService.getComments(token, idToFetch),
				]);
				setComments(commentsData);
				setTaskStack((prevStack) => {
					const newStack = isReset ? [] : [...prevStack];
					newStack.push(taskData);
					return newStack;
				});
				setNewDesc(taskData.description || "");
				setIsEditingDesc(false);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Gagal memuat detail tugas.");
			} finally {
				setIsLoading(false);
			}
		},
		[token]
	);

	const handleNavigateBack = useCallback(() => {
		if (taskStack.length <= 1) return;
		const newStack = taskStack.slice(0, -1);
		const prevTask = newStack[newStack.length - 1];
		setTaskStack(newStack);
		setNewDesc(prevTask.description || "");
		setIsEditingDesc(false);
		if (token && prevTask) {
			setIsLoading(true);
			commentService
				.getComments(token, prevTask.id)
				.then(setComments)
				.finally(() => setIsLoading(false));
		}
	}, [taskStack, token]);

	const refreshCurrentTask = async () => {
		if (!token || !currentTask) return;
		setIsLoading(true);
		try {
			const [taskData, commentsData] = await Promise.all([
				taskService.getTaskById(token, currentTask.id),
				commentService.getComments(token, currentTask.id),
			]);
			setComments(commentsData);
			setTaskStack((prev) => [...prev.slice(0, -1), taskData]);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Gagal menyegarkan data.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen && taskId) {
			handleNavigateToTask(taskId, true);
		} else if (!isOpen) {
			setTaskStack([]);
		}
	}, [isOpen, taskId, handleNavigateToTask]);

	useEffect(() => {
		if (isOpen && currentTask) {
			const intervalId = setInterval(async () => {
				if (token) {
					const commentsData = await commentService.getComments(
						token,
						currentTask.id
					);
					setComments(commentsData);
				}
			}, COMMENT_POLLING_INTERVAL);
			return () => clearInterval(intervalId);
		}
	}, [isOpen, currentTask, token]);

	const handleUpdateTask = (updates: Partial<TaskUpdatePayload>) => {
		if (!token || !currentTask) return;

		const payload = { name: currentTask.name, ...updates };
		const promise = taskService.updateTask(token, currentTask.id, payload);

		showToast(promise, {
			loading: "Memperbarui tugas...",
			success: () => {
				onUpdate();
				refreshCurrentTask();
				return "Tugas berhasil diperbarui.";
			},
			error: (err: Error) => `Gagal memperbarui tugas: ${err.message}`,
		});
	};

	const handleAssign = async (taskId: number, userId: number) => {
		if (!token || !currentTask) return;
		const member = projectMembers.find((m) => m.user_id === userId);
		if (!member) return;

		const promise = taskService.assignTask(token, taskId, userId);
		showToast(promise, {
			loading: `Menugaskan ${member.name}...`,
			success: () => {
				onUpdate();
				refreshCurrentTask();
				return `${member.name} berhasil ditugaskan ke "${currentTask.name}".`;
			},
			error: (err: Error) => `Gagal menugaskan ${member.name}: ${err.message}`,
		});
	};

	const handleUnassign = async (taskId: number, userId: number) => {
		if (!token || !currentTask) return;
		const member = projectMembers.find((m) => m.user_id === userId);
		if (!member) return;

		const promise = taskService.unassignTask(token, taskId, userId);
		showToast(promise, {
			loading: `Melepas penugasan ${member.name}...`,
			success: () => {
				onUpdate();
				refreshCurrentTask();
				return `Penugasan ${member.name} berhasil dilepas.`;
			},
			error: (err: Error) => `Gagal melepas penugasan: ${err.message}`,
		});
	};

	const handleUploadAttachment = async (file: File) => {
		if (!token || !currentTask) return;
		const promise = attachmentService.uploadForTask(token, currentTask.id, file);
		showToast(promise, {
			loading: `Mengunggah ${file.name}...`,
			success: () => {
				refreshCurrentTask();
				return "Lampiran berhasil diunggah.";
			},
			error: (err: Error) => `Gagal mengunggah lampiran: ${err.message}`,
		});
	};

	const handleLinkSubmitForTask = async (payload: AttachmentLinkCreate) => {
		if (!token || !currentTask) return;
		const promise = attachmentService.uploadLinkForTask(
			token,
			currentTask.id,
			payload
		);
		showToast(promise, {
			loading: `Melampirkan link...`,
			success: () => {
				refreshCurrentTask();
				return "Link berhasil dilampirkan.";
			},
			error: (err: Error) => `Gagal melampirkan link: ${err.message}`,
		});
	};

	const handleDeleteAttachment = (attachmentId: number, fileName: string) => {
		if (!token || !currentTask) return;
		const promise = attachmentService.deleteAttachment(token, attachmentId);
		showToast(promise, {
			loading: `Menghapus ${fileName}...`,
			success: () => {
				refreshCurrentTask();
				return "Lampiran berhasil dihapus.";
			},
			error: (err: Error) => `Gagal menghapus lampiran: ${err.message}`,
		});
	};

	const handleCreateComment = async (
		content: string,
		files: File[],
		links: AttachmentLinkCreate[]
	) => {
		if (!token || !currentTask) return;
		const promise = commentService
			.createComment(token, { task_id: currentTask.id, content })
			.then(async (newComment) => {
				const attachmentPromises: Promise<any>[] = [];
				if (files.length > 0) {
					files.forEach((file) =>
						attachmentPromises.push(
							attachmentService.uploadForComment(token, newComment.id, file)
						)
					);
				}
				if (links.length > 0) {
					links.forEach((link) =>
						attachmentPromises.push(
							attachmentService.uploadLinkForComment(token, newComment.id, link)
						)
					);
				}
				await Promise.all(attachmentPromises);
				return newComment;
			});

		showToast(promise, {
			loading: "Mengirim komentar...",
			success: () => {
				refreshCurrentTask();
				return "Komentar berhasil ditambahkan.";
			},
			error: (err: Error) => `Gagal membuat komentar: ${err.message}`,
		});
	};

	const handleDeleteComment = async (commentId: number) => {
		if (!token || !currentTask) return;
		const promise = commentService.deleteComment(
			token,
			currentTask.id,
			commentId
		);
		showToast(promise, {
			loading: "Menghapus komentar...",
			success: () => {
				refreshCurrentTask();
				return "Komentar berhasil dihapus.";
			},
			error: (err: Error) => `Gagal menghapus komentar: ${err.message}`,
		});
	};

	const currentPriorityConfig = useMemo(
		() =>
			currentTask?.priority
				? priorityConfig[currentTask.priority]
				: {
						label: "Pilih Prioritas",
						color: "bg-gray-100 text-gray-800",
						dotColor: "bg-gray-500",
				  },
		[currentTask]
	);

	const assignableMembers = projectMembers.filter(
		(m) => m.project_role === "contributor"
	);

	return (
		<Drawer isOpen={isOpen} onClose={onClose} placement='right'>
			<DrawerContent className='w-[500px] sm:w-[600px] bg-white p-0'>
				{(isLoading || !currentTask) && (
					<div className='flex items-center justify-center h-full'>
						<LoaderCircle className='w-10 h-10 animate-spin text-[var(--color-primary)]' />
					</div>
				)}
				{error && <div className='p-6 text-red-500'>{error}</div>}
				{!isLoading && !error && currentTask && (
					<div className='flex flex-col h-full'>
						<DrawerHeader className='p-6 border-b'>
							<div className='flex justify-between items-start'>
								<div className='flex-1 min-w-0'>
									{taskStack.length > 1 && (
										<div className='flex items-center text-sm text-gray-500 mb-1'>
											<Button
												size='sm'
												variant='light'
												className='-ml-2'
												onPress={handleNavigateBack}>
												<ChevronLeft size={16} /> Kembali
											</Button>
										</div>
									)}
									<h2 className='text-2xl font-bold truncate'>{currentTask.name}</h2>
								</div>
								<Button
									isIconOnly
									variant='light'
									size='sm'
									onPress={onClose}
									className='-mt-2 flex-shrink-0'>
									<X className='h-6 w-6' />
								</Button>
							</div>
						</DrawerHeader>

						<div className='flex-1 overflow-y-auto p-6 space-y-8'>
							<div className='space-y-4'>
								<DetailItem icon={Users} label='Penerima'>
									<AssignTaskPopover
										task={currentTask}
										projectMembers={assignableMembers}
										onAssign={handleAssign}
										onUnassign={handleUnassign}>
										<div className='flex flex-wrap gap-2 items-center cursor-pointer'>
											{currentTask.assignees
												?.filter((a) => a && a.user_id)
												.map((a) => (
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
										date={currentTask.due_date}
										canEdit={canEdit}
										onSave={(newDate) => handleUpdateTask({ due_date: newDate })}
									/>
								</DetailItem>
								<DetailItem icon={BarChart} label='Prioritas'>
									<Dropdown isDisabled={!canEdit}>
										<DropdownTrigger>
											<Button
												size='sm'
												variant='light'
												className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${currentPriorityConfig.color}`}>
												<span
													className={`w-2 h-2 rounded-full ${currentPriorityConfig.dotColor}`}
												/>
												{currentPriorityConfig.label}
											</Button>
										</DropdownTrigger>
										<DropdownMenu
											aria-label='Ubah Prioritas'
											selectionMode='single'
											selectedKeys={currentTask.priority ? [currentTask.priority] : []}
											onAction={(key) =>
												handleUpdateTask({ priority: key as PriorityLevel })
											}>
											{Object.entries(priorityConfig).map(([key, config]) => (
												<DropdownItem
													key={key}
													startContent={
														<span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
													}>
													{config.label}
												</DropdownItem>
											))}
										</DropdownMenu>
									</Dropdown>
								</DetailItem>
								<DetailItem icon={Circle} label='Status'>
									<StatusDisplay
										status={currentTask.status || "pending"}
										userProjectRole={userProjectRole}
										onChange={(newStatus) => handleUpdateTask({ status: newStatus })}
									/>
								</DetailItem>
								<DetailItem icon={ListTodo} label='Sub-Tugas'>
									<div className='space-y-1'>
										{Array.isArray(currentTask.sub_tasks) &&
											currentTask.sub_tasks
												.filter((sub) => sub && typeof sub.id !== "undefined")
												.map((sub) => (
													<button
														key={sub.id}
														onClick={() => handleNavigateToTask(sub.id)}
														className='text-sm text-gray-800 hover:text-[var(--color-primary)] hover:underline flex items-center gap-1 w-full text-left'>
														<ChevronRight size={14} />
														<span>{sub.name}</span>
													</button>
												))}
										{canEdit && (
											<Button
												size='sm'
												variant='light'
												className='text-[var(--color-primary)] p-0 h-auto'
												startContent={<Plus size={14} />}
												onPress={() => onSubtaskCreate(currentTask)}>
												Tambah Sub-tugas
											</Button>
										)}
									</div>
								</DetailItem>
							</div>

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
												className='bg-[var(--color-primary)] text-white'
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
										{currentTask.description || "Tidak ada deskripsi."}
									</p>
								)}
							</div>

							<div className='space-y-2'>
								<h3 className='font-bold text-lg'>Lampiran</h3>
								<div className='space-y-2'>
									{currentTask.attachments
										?.filter((att) => att && att.id)
										.map((att) => (
											<AttachmentItem
												key={att.id}
												attachment={att}
												onDelete={() => handleDeleteAttachment(att.id, att.file_name)}
												canDelete={canEdit}
											/>
										))}
								</div>
								{canEdit && (
									<>
										<AddAttachmentPopover
											onFileUpload={() => fileInputRef.current?.click()}
											onLinkSubmit={handleLinkSubmitForTask}>
											<Button
												size='sm'
												variant='light'
												className='text-[var(--color-primary)] p-0 h-auto'
												startContent={<Plus size={14} />}>
												Tambah Lampiran
											</Button>
										</AddAttachmentPopover>
										<Input
											type='file'
											className='hidden'
											ref={fileInputRef}
											onChange={(e) =>
												e.target.files && handleUploadAttachment(e.target.files[0])
											}
										/>
									</>
								)}
							</div>

							<div className='space-y-4'>
								<div className='flex items-center gap-2'>
									<MessageSquare size={20} className='text-gray-700' />
									<h3 className='font-bold text-lg'>Komentar</h3>
								</div>
								<div className='space-y-6'>
									{comments
										.filter((comment) => comment && comment.id)
										.map((comment) => (
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
								<CommentInput taskId={currentTask.id} onSubmit={handleCreateComment} />
							</div>
						</div>
					</div>
				)}
			</DrawerContent>
		</Drawer>
	);
}
