"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { taskService } from "@/src/services/taskService";
import type { Task } from "@/src/types/task";
import { Drawer, DrawerContent, DrawerHeader, Button } from "@heroui/react";
import { X, LoaderCircle } from "lucide-react";

interface TaskDetailSidebarProps {
	taskId: number | null;
	isOpen: boolean;
	onClose: () => void;
	onUpdate: () => void;
}

export default function TaskDetailSidebar({
	taskId,
	isOpen,
	onClose,
	onUpdate,
}: TaskDetailSidebarProps) {
	const { token } = useAuth();
	const [task, setTask] = useState<Task | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchTaskDetail = useCallback(async () => {
		if (!token || !taskId) return;
		setIsLoading(true);
		setError(null);
		try {
			const detailedTask = await taskService.getTaskById(token, taskId);
			setTask(detailedTask);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal memuat detail tugas.");
		} finally {
			setIsLoading(false);
		}
	}, [token, taskId]);

	useEffect(() => {
		if (isOpen && taskId) {
			fetchTaskDetail();
		} else {
			setTask(null); // Reset task data when sidebar is closed
		}
	}, [isOpen, taskId, fetchTaskDetail]);

	return (
		<Drawer isOpen={isOpen} onClose={onClose}>
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
							<p className='text-sm text-gray-500'>
								Detail tugas, lampiran, dan komentar.
							</p>
						</DrawerHeader>
						<div className='flex-1 overflow-y-auto p-6 space-y-8'>
							{/* Konten detail akan ditambahkan di sini */}
							<p className='text-gray-500 italic'>
								Fitur detail, inline edit, lampiran, dan komentar akan diimplementasikan
								di sini.
							</p>
						</div>
					</div>
				)}
			</DrawerContent>
		</Drawer>
	);
}
