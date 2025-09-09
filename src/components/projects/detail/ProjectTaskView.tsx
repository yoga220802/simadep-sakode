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
import TaskDetailSidebar from "./TaskDetailSidebar";

export default function ProjectTaskView() {
	const { user, token } = useAuth();
	const params = useParams();
	const projectId = Number(params.id);

	const [milestones, setMilestones] = useState<Milestone[]>([]);
	const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// State untuk sidebar detail tugas
	const [isDetailSidebarOpen, setIsDetailSidebarOpen] = useState(false);
	const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

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

	const handleOpenTaskDetail = (task: Task) => {
		setSelectedTaskId(task.id);
		setIsDetailSidebarOpen(true);
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
						onTaskCreate={() => {}}
						onSubtaskCreate={() => {}}
						onTaskEdit={handleOpenTaskDetail}
					/>
				))}
			</div>
			<TaskDetailSidebar
				taskId={selectedTaskId}
				isOpen={isDetailSidebarOpen}
				onClose={() => setIsDetailSidebarOpen(false)}
				onUpdate={fetchData}
			/>
		</>
	);
}
