"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { taskService } from "@/src/services/taskService";
import { projectService } from "@/src/services/projectService";
import type { Task, TaskAssignee } from "@/src/types/task";
import type { ProjectMember } from "@/src/types/project";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@heroui/react";
import MilestoneGroup from "./MilestoneGroup";

// --- SIMULASI DATA ASSIGNEE ---
// Fungsi ini akan "menyuntikkan" data assignee palsu ke dalam task
// Ini bisa dihapus ketika backend sudah menyertakan data assignee
const simulateAssignees = (tasks: Task[], members: ProjectMember[]): Task[] => {
	if (!members.length) return tasks;
	return tasks.map((task, index) => {
		const newAssignees: TaskAssignee[] = [];
		// Tugaskan satu atau dua member secara acak untuk demo
		if (members[index % members.length]) {
			const member = members[index % members.length];
			newAssignees.push({
				user_id: member.user_id,
				name: member.name,
				email: member.email, // Ensure email is included
				project_role: member.project_role, // Ensure project_role is included
				profile_url: `https://i.pravatar.cc/40?u=${member.user_id}`,
			});
		}

		return {
			...task,
			assignees: task.assignees || newAssignees,
			sub_tasks: task.sub_tasks ? simulateAssignees(task.sub_tasks, members) : [],
		};
	});
};
// --- AKHIR SIMULASI ---

export default function ProjectTaskView() {
	const { user, token } = useAuth();
	const params = useParams();
	const projectId = Number(params.id);

	const [tasks, setTasks] = useState<Task[]>([]);
	const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		if (!token || !projectId) return;
		setIsLoading(true);
		setError(null);
		try {
			// Ambil tasks dan members secara bersamaan
			const [taskData, projectData] = await Promise.all([
				taskService.getTasks(token, projectId),
				projectService.getProjectById(token, projectId),
			]);

			const members = projectData.members || [];
			setProjectMembers(members);

			// Hapus baris ini jika backend sudah mengirim data assignee
			const tasksWithSimulatedAssignees = simulateAssignees(taskData, members);
			setTasks(tasksWithSimulatedAssignees);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal memuat data.");
		} finally {
			setIsLoading(false);
		}
	}, [token, projectId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const milestones = useMemo(() => {
		return tasks.filter((task) => task.resource_type === "milestone");
	}, [tasks]);

	const handleCreateMilestone = async () => {
		// ... (logika create milestone tetap sama)
	};

	const handleAssign = useCallback(
		async (taskId: number, userId: number) => {
			if (!token) return;
			await taskService.assignTask(token, taskId, userId);
			// Optimistic UI update for simulation
			const memberToAssign = projectMembers.find((m) => m.user_id === userId);
			if (!memberToAssign) return;

			const updateTasks = (currentTasks: Task[]): Task[] => {
				return currentTasks.map((t) => {
					if (t.id === taskId) {
						const newAssignees = [
							...(t.assignees || []),
							{
								user_id: memberToAssign.user_id,
								name: memberToAssign.name,
								profile_url: `https://i.pravatar.cc/40?u=${memberToAssign.user_id}`,
							},
						];
						return { ...t, assignees: newAssignees };
					}
					if (t.sub_tasks) {
						return { ...t, sub_tasks: updateTasks(t.sub_tasks) };
					}
					return t;
				});
			};
			setTasks(updateTasks);
		},
		[token, projectMembers]
	);

	const handleUnassign = useCallback(
		async (taskId: number, userId: number) => {
			if (!token) return;
			await taskService.unassignTask(token, taskId, userId);
			// Optimistic UI update for simulation
			const updateTasks = (currentTasks: Task[]): Task[] => {
				return currentTasks.map((t) => {
					if (t.id === taskId) {
						const newAssignees = t.assignees?.filter((a) => a.user_id !== userId);
						return { ...t, assignees: newAssignees };
					}
					if (t.sub_tasks) {
						return { ...t, sub_tasks: updateTasks(t.sub_tasks) };
					}
					return t;
				});
			};
			setTasks(updateTasks);
		},
		[token]
	);

	// ... (Render logic tetap sama)
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
		<div className='space-y-8 py-6'>
			{milestones.map((milestone) => (
				<MilestoneGroup
					key={milestone.id}
					milestone={milestone}
					projectMembers={projectMembers}
					onUpdate={fetchData}
					onAssign={handleAssign}
					onUnassign={handleUnassign}
				/>
			))}
			<div className='mt-6'>
				<Button
					onPress={handleCreateMilestone}
					variant='light'
					className='text-gray-600 font-semibold'
					startContent={<Plus size={18} />}>
					Tambah Daftar Tabel Baru
				</Button>
			</div>
		</div>
	);
}

// Perlu update juga di MilestoneGroup.tsx untuk pass props ke TaskRow
