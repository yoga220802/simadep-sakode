"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { taskService } from "@/src/services/taskService";
import { projectService } from "@/src/services/projectService";
import { categoryService } from "@/src/services/categoryService";
import type {
	Milestone,
	Task,
	TaskCreatePayload,
	TaskUpdatePayload,
	MilestoneCreatePayload,
} from "@/src/types/task";
import type { Category } from "@/src/types/category";
import type { ProjectMember, ProjectRole } from "@/src/types/project";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@heroui/react";
import MilestoneGroup from "./MilestoneGroup";
import TaskDetailSidebar from "./TaskDetailSidebar";
import TaskFormModal from "./TaskFormModal";

export default function ProjectTaskView() {
	const { user, token } = useAuth();
	const params = useParams();
	const projectId = Number(params.id);

	const [milestones, setMilestones] = useState<Milestone[]>([]);
	const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// State for task detail sidebar
	const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
	const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

	// State for create/edit modal
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [formMode, setFormMode] = useState<
		"createMilestone" | "createTask" | "createSubtask" | "editTask"
	>("createTask");
	const [creationContext, setCreationContext] = useState<{
		milestoneId?: number;
		parentTaskId?: number;
	}>({});

	const fetchData = useCallback(async () => {
		if (!token || !projectId) return;
		setError(null);
		try {
			const [milestoneData, projectData, categoryData] = await Promise.all([
				taskService.getMilestones(token, projectId),
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
	}, [token, projectId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const userProjectRole = useMemo(() => {
		const member = projectMembers.find((m) => m.user_id.toString() === user?.id);
		return member?.project_role || "viewer";
	}, [projectMembers, user]);

	// Handlers for opening modals/sidebars
	const handleOpenTaskDetail = (task: Task) => {
		setSelectedTaskId(task.id);
		setIsDetailSidebarOpen(true);
	};

	const handleOpenCreateMilestone = () => {
		setFormMode("createMilestone");
		setCreationContext({});
		setIsFormModalOpen(true);
	};

	const handleOpenCreateTask = (milestone: Milestone) => {
		setFormMode("createTask");
		setCreationContext({ milestoneId: milestone.id });
		setIsFormModalOpen(true);
	};

	const handleOpenCreateSubtask = (parentTask: Task) => {
		setFormMode("createSubtask");
		setCreationContext({ parentTaskId: parentTask.id });
		setIsFormModalOpen(true);
	};

	// Handlers for API actions
	const handleSaveForm = async (
		data: TaskUpdatePayload | TaskCreatePayload | MilestoneCreatePayload
	) => {
		if (!token) return;

		try {
			if (formMode === "createMilestone") {
				await taskService.createMilestone(
					token,
					projectId,
					data as MilestoneCreatePayload
				);
			} else if (formMode === "createTask" && creationContext.milestoneId) {
				await taskService.createTaskInMilestone(
					token,
					creationContext.milestoneId,
					data as TaskCreatePayload
				);
			} else if (formMode === "createSubtask" && creationContext.parentTaskId) {
				await taskService.createSubtask(
					token,
					creationContext.parentTaskId,
					data as TaskCreatePayload
				);
			}
			fetchData();
		} catch (error) {
			console.error("Gagal menyimpan:", error);
			// Re-throw agar bisa ditangkap di modal
			throw error;
		}
	};

	const handleAssign = useCallback(
		async (taskId: number, userId: number) => {
			if (!token) return;
			try {
				await taskService.assignTask(token, taskId, userId);
				fetchData();
			} catch (error) {
				console.error("Gagal menugaskan:", error);
			}
		},
		[token, fetchData]
	);

	const handleUnassign = useCallback(
		async (taskId: number, userId: number) => {
			if (!token) return;
			try {
				await taskService.unassignTask(token, taskId, userId);
				fetchData();
			} catch (error) {
				console.error("Gagal melepas penugasan:", error);
			}
		},
		[token, fetchData]
	);

	const handleCategoryChange = useCallback(
		async (taskId: number, categoryId: number | null) => {
			if (!token) return;
			try {
				if (categoryId) {
					await categoryService.assignCategoryToTask(token, taskId, categoryId);
				} else {
					await categoryService.unassignCategoryFromTask(token, taskId);
				}
				fetchData();
			} catch (error) {
				console.error("Gagal mengubah kategori:", error);
			}
		},
		[token, fetchData]
	);

	if (isLoading) {
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
			<div className='space-y-8 py-6'>
				{milestones.map((milestone) => (
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
					/>
				))}
				{userProjectRole === "owner" && (
					<div className='flex justify-center'>
						<Button
							variant='light'
							className='text-primary font-semibold'
							startContent={<Plus size={18} />}
							onPress={handleOpenCreateMilestone}>
							Tambah Milestone
						</Button>
					</div>
				)}
			</div>

			<TaskDetailSidebar
				taskId={selectedTaskId}
				isOpen={isDetailSidebarOpen}
				onClose={() => setIsDetailSidebarOpen(false)}
				onUpdate={fetchData}
				projectMembers={projectMembers}
				userProjectRole={userProjectRole}
			/>

			<TaskFormModal
				isOpen={isFormModalOpen}
				onClose={() => setIsFormModalOpen(false)}
				onSave={handleSaveForm}
				mode={formMode}
			/>
		</>
	);
}
