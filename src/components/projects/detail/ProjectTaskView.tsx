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
} from "@/src/types/task";
import type { Category } from "@/src/types/category";
import type { ProjectMember, ProjectRole } from "@/src/types/project";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@heroui/react";
import MilestoneGroup from "./MilestoneGroup";
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

	// State untuk modal
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<
		"createMilestone" | "createTask" | "createSubtask" | "editTask"
	>("createMilestone");
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [parentTask, setParentTask] = useState<Task | Milestone | null>(null);

	const fetchData = useCallback(async () => {
		if (!token || !projectId) return;
		// Do not set loading to true here for smoother re-fetches
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
			setIsLoading(false); // Only set loading to false after all fetches are done
		}
	}, [token, projectId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const userProjectRole = useMemo(() => {
		const member = projectMembers.find((m) => m.user_id.toString() === user?.id);
		return member?.project_role || "viewer";
	}, [projectMembers, user]);

	// Handlers untuk membuka modal
	const handleOpenCreateMilestone = () => {
		setModalMode("createMilestone");
		setEditingTask(null);
		setParentTask(null);
		setIsModalOpen(true);
	};

	const handleOpenCreateTask = (milestone: Milestone) => {
		setModalMode("createTask");
		setEditingTask(null);
		setParentTask(milestone);
		setIsModalOpen(true);
	};

	const handleOpenCreateSubtask = (task: Task) => {
		setModalMode("createSubtask");
		setEditingTask(null);
		setParentTask(task);
		setIsModalOpen(true);
	};

	const handleOpenEditTask = (task: Task) => {
		setModalMode("editTask");
		setEditingTask(task);
		setParentTask(null);
		setIsModalOpen(true);
	};

	const handleSaveTask = async (data: TaskCreatePayload | TaskUpdatePayload) => {
		if (!token) return;

		try {
			switch (modalMode) {
				case "createMilestone":
					await taskService.createMilestone(token, projectId, {
						title: data.name || "Milestone Baru",
					});
					break;
				case "createTask":
					if (parentTask) {
						await taskService.createTaskInMilestone(
							token,
							parentTask.id,
							data as TaskCreatePayload
						);
					}
					break;
				case "createSubtask":
					if (parentTask) {
						await taskService.createSubtask(
							token,
							parentTask.id,
							data as TaskCreatePayload
						);
					}
					break;
				case "editTask":
					if (editingTask) {
						await taskService.updateTask(
							token,
							editingTask.id,
							data as TaskUpdatePayload
						);
					}
					break;
			}
			fetchData(); // Refresh data
		} catch (error) {
			console.error("Gagal menyimpan:", error);
			// Tambahkan notifikasi error ke user di sini
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
						onTaskEdit={handleOpenEditTask}
					/>
				))}
				{userProjectRole === "owner" && (
					<div className='mt-6'>
						<Button
							onPress={handleOpenCreateMilestone}
							variant='light'
							className='text-gray-600 font-semibold'
							startContent={<Plus size={18} />}>
							Tambah Milestone Baru
						</Button>
					</div>
				)}
			</div>
			<TaskFormModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSave={handleSaveTask}
				mode={modalMode}
				task={editingTask}
			/>
		</>
	);
}
