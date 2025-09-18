"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext";
import { taskService } from "@/src/services/taskService";
import { projectService } from "@/src/services/projectService";
import { categoryService } from "@/src/services/categoryService";
import type {
	Milestone,
	MilestoneCreatePayload,
	Task,
	TaskCreatePayload,
	TaskUpdatePayload,
	TaskSortBy,
} from "@/src/types/task";
import type { Category } from "@/src/types/category";
import type { ProjectMember } from "@/src/types/project";
import { LoaderCircle, Plus } from "lucide-react";
import { Button, useDisclosure } from "@heroui/react";
import MilestoneGroup from "./MilestoneGroup";
import TaskDetailSidebar from "./TaskDetailSidebar";
import TaskFormModal from "./TaskFormModal";
import DeleteConfirmationModal from "../../common/DeleteConfirmationModal";
import TaskFilterControls from "./TaskFilterControls";
import type { SortDescriptor } from "@react-types/shared";

export default function ProjectTaskView() {
	const { user, token } = useAuth();
	const { showToast } = useAppToast();
	const params = useParams();
	const projectId = Number(params.id);

	const [milestones, setMilestones] = useState<Milestone[]>([]);
	const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// State for filter and sort
	const [filters, setFilters] = useState({
		hideCompleted: false,
		showOnlyMyTasks: false,
	});
	const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
		column: "display_order",
		direction: "ascending",
	});

	// State for task detail sidebar
	const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
	const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

	// State for form modal
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [formMode, setFormMode] = useState<
		"createMilestone" | "createTask" | "createSubtask" | "editTask"
	>("createTask");
	const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(
		null
	);
	const [parentTask, setParentTask] = useState<Task | null>(null);

	// State for delete task modal
	const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
	const {
		isOpen: isDeleteTaskModalOpen,
		onOpen: onDeleteTaskModalOpen,
		onClose: onDeleteTaskModalClose,
	} = useDisclosure();

	const fetchData = useCallback(async () => {
		if (!token || !projectId) return;
		setIsLoading(true);
		setError(null);
		try {
			const [milestoneData, projectData, categoryData] = await Promise.all([
				taskService.getMilestones(
					token,
					projectId,
					sortDescriptor.column as TaskSortBy,
					sortDescriptor.direction === "descending"
				),
				projectService.getProjectById(token, projectId),
				categoryService.getCategories(token, projectId),
			]);
			setMilestones(milestoneData);
			setProjectMembers(projectData.members || []);
			setCategories(categoryData);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal memuat data tugas.");
		} finally {
			setIsLoading(false);
		}
	}, [token, projectId, sortDescriptor]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const userProjectRole = useMemo(() => {
		const member = projectMembers.find((m) => m.user_id.toString() === user?.id);
		return member?.project_role || "viewer";
	}, [projectMembers, user]);

	const canEdit = userProjectRole === "owner";

	const handleFilterChange = (
		filterName: "hideCompleted" | "showOnlyMyTasks"
	) => {
		setFilters((prev) => ({ ...prev, [filterName]: !prev[filterName] }));
	};

	const filteredMilestones = useMemo(() => {
		if (!filters.hideCompleted && !filters.showOnlyMyTasks) {
			return milestones;
		}

		const userId = user?.id ? parseInt(user.id, 10) : null;

		const filterTasksRecursively = (tasks: Task[]): Task[] => {
			let filtered = tasks;

			if (filters.hideCompleted) {
				filtered = filtered.filter((task) => task.status !== "completed");
			}

			if (filters.showOnlyMyTasks && userId) {
				filtered = filtered.filter((task) => {
					const isAssignedToMe = task.assignees.some(
						(assignee) => assignee.user_id === userId
					);
					const hasAssignedSubtask =
						task.sub_tasks && filterTasksRecursively(task.sub_tasks).length > 0;
					return isAssignedToMe || hasAssignedSubtask;
				});
			}

			return filtered.map((task) => ({
				...task,
				sub_tasks: task.sub_tasks ? filterTasksRecursively(task.sub_tasks) : [],
			}));
		};

		return milestones
			.map((milestone) => ({
				...milestone,
				tasks: filterTasksRecursively(milestone.tasks),
			}))
			.filter((milestone) => milestone.tasks.length > 0);
	}, [milestones, filters, user]);

	const handleOpenTaskDetail = (task: Task) => {
		setSelectedTaskId(task.id);
		setIsDetailSidebarOpen(true);
	};

	const handleOpenCreateMilestone = () => {
		setFormMode("createMilestone");
		setIsFormModalOpen(true);
	};

	const handleOpenCreateTask = (milestone: Milestone) => {
		setFormMode("createTask");
		setCurrentMilestone(milestone);
		setIsFormModalOpen(true);
	};

	const handleOpenCreateSubtask = (task: Task) => {
		setFormMode("createSubtask");
		setParentTask(task);
		setIsFormModalOpen(true);
	};

	const handleOpenDeleteTask = (task: Task) => {
		setTaskToDelete(task);
		onDeleteTaskModalOpen();
	};

	const handleConfirmDeleteTask = async () => {
		if (!token || !taskToDelete) return;
		const promise = taskService.deleteTask(token, taskToDelete.id);
		showToast(promise, {
			loading: `Menghapus tugas "${taskToDelete.name}"...`,
			success: () => {
				fetchData();
				onDeleteTaskModalClose();
				return "Tugas berhasil dihapus.";
			},
			error: (err: Error) => `Gagal menghapus tugas: ${err.message}`,
		});
	};

	const handleSaveForm = async (
		data: TaskCreatePayload | MilestoneCreatePayload | TaskUpdatePayload
	) => {
		if (!token) return;

		let promise: Promise<Task | Milestone>;
		let loadingTitle = "";
		let successDesc = "";
		let errorPrefix = "";

		switch (formMode) {
			case "createMilestone":
				loadingTitle = "Membuat milestone baru...";
				successDesc = `Milestone "${
					(data as { title: string }).title
				}" berhasil dibuat.`;
				errorPrefix = "Gagal membuat milestone";
				promise = taskService.createMilestone(
					token,
					projectId,
					data as { title: string }
				);
				break;
			case "createTask":
				loadingTitle = "Membuat tugas baru...";
				successDesc = `Tugas "${
					(data as TaskCreatePayload).name
				}" berhasil dibuat.`;
				errorPrefix = "Gagal membuat tugas";
				promise = taskService.createTaskInMilestone(
					token,
					currentMilestone!.id,
					data as TaskCreatePayload
				);
				break;
			case "createSubtask":
				loadingTitle = "Membuat subtugas baru...";
				successDesc = `Subtugas "${
					(data as TaskCreatePayload).name
				}" berhasil dibuat.`;
				errorPrefix = "Gagal membuat subtugas";
				promise = taskService.createSubtask(
					token,
					parentTask!.id,
					data as TaskCreatePayload
				);
				break;
			default:
				// If formMode is not one of the handled cases (e.g., "editTask"),
				// we should not proceed.
				console.error(`Unhandled form mode: ${formMode}`);
				return;
		}

		showToast(promise, {
			loading: loadingTitle,
			success: () => {
				fetchData();
				setIsFormModalOpen(false);
				return successDesc;
			},
			error: (err: Error) => `${errorPrefix}: ${err.message}`,
		});
	};

	const handleAssign = useCallback(
		async (taskId: number, userId: number) => {
			if (!token) return;
			const member = projectMembers.find((m) => m.user_id === userId);
			const task = milestones
				.flatMap((m) => [...m.tasks, ...m.tasks.flatMap((t) => t.sub_tasks || [])])
				.find((t) => t.id === taskId);
			if (!member || !task) return;

			const promise = taskService.assignTask(token, taskId, userId);
			showToast(promise, {
				loading: `Menugaskan ${member.name}...`,
				success: () => {
					fetchData();
					return `${member.name} berhasil ditugaskan ke "${task.name}".`;
				},
				error: (err: Error) => `Gagal menugaskan ${member.name}: ${err.message}`,
			});
		},
		[token, fetchData, showToast, projectMembers, milestones]
	);

	const handleUnassign = useCallback(
		async (taskId: number, userId: number) => {
			if (!token) return;
			const member = projectMembers.find((m) => m.user_id === userId);
			const task = milestones
				.flatMap((m) => [...m.tasks, ...m.tasks.flatMap((t) => t.sub_tasks || [])])
				.find((t) => t.id === taskId);
			if (!member || !task) return;

			const promise = taskService.unassignTask(token, taskId, userId);
			showToast(promise, {
				loading: `Melepas penugasan ${member.name}...`,
				success: () => {
					fetchData();
					return `Penugasan ${member.name} dari "${task.name}" berhasil dilepas.`;
				},
				error: (err: Error) => `Gagal melepas penugasan: ${err.message}`,
			});
		},
		[token, fetchData, showToast, projectMembers, milestones]
	);

	const handleCategoryChange = useCallback(
		async (taskId: number, categoryId: number | null) => {
			if (!token) return;
			const promise = categoryId
				? categoryService.assignCategoryToTask(token, taskId, categoryId)
				: categoryService.unassignCategoryFromTask(token, taskId);

			showToast(promise, {
				loading: "Mengubah kategori...",
				success: () => {
					fetchData();
					return "Kategori tugas berhasil diperbarui.";
				},
				error: (err: Error) => `Gagal mengubah kategori: ${err.message}`,
			});
		},
		[token, fetchData, showToast]
	);

	if (isLoading && milestones.length === 0) {
		return (
			<div className='flex justify-center items-center h-64'>
				<LoaderCircle className='w-12 h-12 animate-spin text-primary' />
			</div>
		);
	}
	if (error) {
		return <div className='text-center text-red-500 py-10'>{error}</div>;
	}

	return (
		<>
			<div className='mt-6 bg-white rounded-lg border border-gray-200'>
				<TaskFilterControls
					filters={filters}
					onFilterChange={handleFilterChange}
					sortDescriptor={sortDescriptor}
					onSortChange={setSortDescriptor}
					userProjectRole={userProjectRole}
				/>
				<div className='space-y-8 p-6 relative'>
					{isLoading && (
						<div className='absolute inset-0 bg-white/50 flex items-center justify-center z-10'>
							<LoaderCircle className='w-8 h-8 animate-spin text-primary' />
						</div>
					)}
					{filteredMilestones.map((milestone) => (
						<MilestoneGroup
							key={milestone.id}
							milestone={milestone}
							projectMembers={projectMembers}
							categories={categories}
							userProjectRole={userProjectRole}
							onUpdate={fetchData}
							onAssign={handleAssign}
							onUnassign={handleUnassign}
							onCategoryChange={handleCategoryChange}
							onTaskCreate={handleOpenCreateTask}
							onSubtaskCreate={handleOpenCreateSubtask}
							onTaskEdit={handleOpenTaskDetail}
							onTaskDelete={handleOpenDeleteTask}
						/>
					))}
					{canEdit && (
						<Button
							variant='light'
							className='text-primary font-semibold'
							startContent={<Plus size={16} />}
							onPress={handleOpenCreateMilestone}>
							Buat Milestone
						</Button>
					)}
					{!isLoading && filteredMilestones.length === 0 && (
						<div className='text-center py-10 text-gray-500'>
							<p>Tidak ada tugas yang sesuai dengan filter Anda.</p>
						</div>
					)}
				</div>
			</div>

			<TaskDetailSidebar
				taskId={selectedTaskId}
				isOpen={isDetailSidebarOpen}
				onClose={() => setIsDetailSidebarOpen(false)}
				onUpdate={fetchData}
				projectMembers={projectMembers}
				userProjectRole={userProjectRole}
				onSubtaskCreate={handleOpenCreateSubtask}
			/>

			<TaskFormModal
				isOpen={isFormModalOpen}
				onClose={() => setIsFormModalOpen(false)}
				onSave={handleSaveForm}
				mode={formMode}
			/>
			{taskToDelete && (
				<DeleteConfirmationModal
					isOpen={isDeleteTaskModalOpen}
					onClose={onDeleteTaskModalClose}
					onConfirm={handleConfirmDeleteTask}
					isLoading={false}
					itemName={taskToDelete.name}
					itemType='tugas'
				/>
			)}
		</>
	);
}
