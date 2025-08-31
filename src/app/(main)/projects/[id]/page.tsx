"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { projectService } from "@/src/services/projectService";
import type { Project } from "@/src/types/project";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import ProjectHeader from "@/src/components/projects/detail/ProjectHeader";
import ProjectDetailView from "@/src/components/projects/detail/ProjectDetailView";
import ProjectTaskView from "@/src/components/projects/detail/ProjectTaskView";

export default function ProjectDetailPage() {
	const params = useParams();
	const { id } = params;
	const { user, token } = useAuth();

	const [project, setProject] = useState<Project | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"detail" | "daftar" | "laporan">(
		"detail"
	);

	const fetchProject = useCallback(async () => {
		if (token && typeof id === "string") {
			// Tidak set isLoading jadi true di sini agar refresh lebih smooth
			setError(null);
			try {
				const data = await projectService.getProjectById(token, id);
				setProject(data);
			} catch (err) {
				if (err instanceof Error) {
					setError(err.message);
					if (err.message.includes("tidak ditemukan")) {
						notFound();
					}
				} else {
					setError("Terjadi kesalahan yang tidak diketahui.");
				}
			} finally {
				setIsLoading(false); // Hanya set false setelah fetch selesai
			}
		}
	}, [id, token]);

	useEffect(() => {
		setIsLoading(true); // Set loading hanya saat komponen pertama kali mount
		fetchProject();
	}, [fetchProject]);

	if (isLoading) {
		return (
			<div className='flex items-center justify-center h-full pt-16'>
				<LoaderCircle className='w-12 h-12 animate-spin text-[var(--color-primary)]' />
			</div>
		);
	}

	if (error) {
		return (
			<div className='flex flex-col items-center justify-center h-full pt-16 text-center'>
				<ShieldAlert className='w-16 h-16 text-red-500 mb-4' />
				<h2 className='text-2xl font-bold text-text-main mb-2'>
					Gagal Memuat Proyek
				</h2>
				<p className='text-gray-500'>{error}</p>
			</div>
		);
	}

	if (!project || !user) {
		return null;
	}

	return (
		<div className='space-y-8'>
			<ProjectHeader
				project={project}
				user={user}
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				onProjectUpdate={fetchProject} // Kirim fungsi update
			/>
			<div className='mt-6'>
				{activeTab === "detail" && (
					<ProjectDetailView
						project={project}
						user={user}
						onDataUpdate={fetchProject}
					/>
				)}
				{activeTab === "daftar" && (
						<ProjectTaskView />
				)}
				{activeTab === "laporan" && (
					<div className='p-8 bg-white rounded-lg border-2 border-gray-200'>
						<h2 className='text-xl font-bold'>Laporan Proyek</h2>
						<p className='mt-2 text-gray-600'>
							Fitur laporan proyek sedang dalam pengembangan.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
