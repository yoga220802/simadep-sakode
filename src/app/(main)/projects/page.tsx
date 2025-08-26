"use client";

import { useState, useEffect, useMemo, useCallback } from "react"; // FIX: import useCallback
import { useAuth } from "@/src/context/AuthContext";
import { projectService } from "@/src/services/projectService";
import type { Project, ProjectStatus } from "@/src/types/project";
import ProjectCard from "@/src/components/projects/ProjectCard";
import CreateProject from "@/src/components/projects/CreateProject";
import Pagination from "@/src/components/common/Pagination";
import DeleteConfirmationModal from "@/src/components/common/DeleteConfirmationModal";
import ProjectFormModal from "@/src/components/projects/ProjectFormModal";
import ProjectFilterTabs from "@/src/components/projects/ProjectFilterTabs";
import { LoaderCircle } from "lucide-react";

const ITEMS_PER_PAGE = 9;

export default function ProjectsPage() {
	const { user, token } = useAuth();
	const [allProjects, setAllProjects] = useState<Project[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [activeFilter, setActiveFilter] = useState<ProjectStatus | "all">("all");
	const [currentPage, setCurrentPage] = useState(1);

	// State untuk mengelola modal
	const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
	const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const fetchAllProjects = useCallback(async () => {
		if (token) {
			setIsLoading(true);
			try {
				const response = await projectService.getProjects(token, 1, 999);
				setAllProjects(response.items);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		}
	}, [token]);

	useEffect(() => {
		fetchAllProjects();
	}, [fetchAllProjects]);

	// Handler untuk membuka modal
	const handleOpenCreateModal = () => {
		setProjectToEdit(null);
		setIsFormModalOpen(true);
	};

	const handleOpenEditModal = (project: Project) => {
		setProjectToEdit(project);
		setIsFormModalOpen(true);
	};

	const handleOpenDeleteModal = (project: Project) => {
		setProjectToDelete(project);
		setIsDeleteModalOpen(true);
	};

	// Handler untuk aksi delete
	const handleDeleteConfirm = async () => {
		if (!token || !projectToDelete) return;
		setIsSubmitting(true);
		try {
			await projectService.deleteProject(token, projectToDelete.id.toString());
			fetchAllProjects(); // Refresh list
			setIsDeleteModalOpen(false);
			setProjectToDelete(null);
		} catch (error) {
			console.error("Gagal menghapus proyek:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const filteredProjects = useMemo(() => {
		if (activeFilter === "all") return allProjects;
		return allProjects.filter((p) => p.status === activeFilter);
	}, [allProjects, activeFilter]);

	const projectCounts = useMemo(() => {
		const counts: Record<ProjectStatus | "all", number> = {
			all: allProjects.length,
			tender: 0,
			active: 0,
			completed: 0,
			cancel: 0,
		};
		allProjects.forEach((p) => {
			if (counts[p.status] !== undefined) {
				counts[p.status]++;
			}
		});
		return counts;
	}, [allProjects]);

	useEffect(() => {
		setCurrentPage(1);
	}, [activeFilter]);

	const paginatedProjects = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		const endIndex = startIndex + ITEMS_PER_PAGE;
		return filteredProjects.slice(startIndex, endIndex);
	}, [filteredProjects, currentPage]);

	const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

	return (
		<>
			<div className='space-y-6'>
				<div className='flex justify-between items-center'>
					<ProjectFilterTabs
						user={user}
						activeFilter={activeFilter}
						onFilterChange={setActiveFilter}
						projectCounts={projectCounts}
					/>
					{user?.role === "Project Manager" && (
						<CreateProject onOpenCreateModal={handleOpenCreateModal} />
					)}
				</div>

				{isLoading ? (
					<div className='flex justify-center items-center h-64'>
						<LoaderCircle className='w-12 h-12 animate-spin text-[var(--color-primary)]' />
					</div>
				) : (
					<>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{paginatedProjects.map((project) => (
								<ProjectCard
									key={project.id}
									project={project}
									onEdit={handleOpenEditModal}
									onDelete={handleOpenDeleteModal}
								/>
							))}
						</div>
						{totalPages > 1 && (
							<Pagination
								currentPage={currentPage}
								totalPages={totalPages}
								onPageChange={setCurrentPage}
							/>
						)}
					</>
				)}
			</div>

			<ProjectFormModal
				isOpen={isFormModalOpen}
				onClose={() => setIsFormModalOpen(false)}
				onProjectUpdate={fetchAllProjects}
				projectToEdit={projectToEdit}
			/>

			{projectToDelete && (
				<DeleteConfirmationModal
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
					onConfirm={handleDeleteConfirm}
					isLoading={isSubmitting}
					itemName={projectToDelete.title}
				/>
			)}
		</>
	);
}
