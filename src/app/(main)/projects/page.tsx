"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext";
import { projectService } from "@/src/services/projectService";
import type { Project, ProjectStatus } from "@/src/types/project";
import ProjectCard from "@/src/components/projects/ProjectCard";
import CreateProject from "@/src/components/projects/CreateProject";
import { Pagination } from "@/src/shared/ui";
import DeleteConfirmationModal from "@/src/components/common/DeleteConfirmationModal";
import ProjectFormModal from "@/src/components/projects/ProjectFormModal";
import ProjectFilterTabs from "@/src/components/projects/ProjectFilterTabs";
import { LoaderCircle } from "lucide-react";
import ProjectYearFilter from "@/src/components/projects/ProjectYearFilter";

const ITEMS_PER_PAGE = 9;

export default function ProjectsPage() {
	const { user, token } = useAuth();
	const { showToast } = useAppToast();
	const router = useRouter();

	const [projects, setProjects] = useState<Project[]>([]);
	const [projectCounts, setProjectCounts] = useState<
		Record<ProjectStatus | "all", number>
	>({
		all: 0,
		tender: 0,
		active: 0,
		completed: 0,
		cancel: 0,
	});
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(true);

	// State untuk filter
	const [activeStatusFilter, setActiveStatusFilter] = useState<
		ProjectStatus | "all"
	>("all");
	const [startYear, setStartYear] = useState<number | null>(null);
	const [endYear, setEndYear] = useState<number | null>(null);
	const [currentPage, setCurrentPage] = useState(1);

	// State untuk modal
	const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
	const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	const fetchProjects = useCallback(async () => {
		if (token) {
			setIsLoading(true);
			try {
				const response = await projectService.getProjects(
					token,
					currentPage,
					ITEMS_PER_PAGE,
					{
						status: activeStatusFilter,
						startYear,
						endYear,
					}
				);
				setProjects(response.items);
				setTotalPages(response.total_page);
				// Update counts dari summary API
				setProjectCounts({
					all: response.summary.total_project,
					tender: response.summary.project_tender,
					active: response.summary.project_active,
					completed: response.summary.project_completed,
					cancel: response.summary.project_cancel,
				});
			} catch (error) {
				showToast(
					error instanceof Error ? error.message : "Gagal memuat proyek.",
					"error"
				);
			} finally {
				setIsLoading(false);
			}
		}
	}, [token, showToast, currentPage, activeStatusFilter, startYear, endYear]);

	useEffect(() => {
		fetchProjects();
	}, [fetchProjects]);

	// Reset halaman ke 1 saat filter berubah
	useEffect(() => {
		setCurrentPage(1);
	}, [activeStatusFilter, startYear, endYear]);

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

	const handleDeleteConfirm = () => {
		if (!token || !projectToDelete) return;

		const deletePromise = projectService.deleteProject(
			token,
			projectToDelete.id.toString()
		);

		showToast(deletePromise, {
			loading: `Menghapus proyek "${projectToDelete.title}"...`,
			success: () => {
				fetchProjects();
				return `Proyek "${projectToDelete.title}" berhasil dihapus.`;
			},
			error: (err: Error) => `Gagal menghapus proyek: ${err.message}`,
		});

		setIsDeleteModalOpen(false);
		setProjectToDelete(null);
	};

	const handleFormSaveSuccess = (project: Project, isNew: boolean) => {
		setIsFormModalOpen(false);
		if (isNew) {
			router.push(`/projects/${project.id}`);
		} else {
			fetchProjects();
		}
	};

	const handleYearChange = (start: number | null, end: number | null) => {
		setStartYear(start);
		setEndYear(end);
	};

	return (
		<>
			<div className='space-y-6'>
				<div className='flex flex-wrap justify-between items-start gap-4'>
					<div className='flex flex-col gap-4'>
						<ProjectFilterTabs
							user={user}
							activeFilter={activeStatusFilter}
							onFilterChange={setActiveStatusFilter}
							projectCounts={projectCounts}
							/>
						<ProjectYearFilter
							startYear={startYear}
							endYear={endYear}
							onYearChange={handleYearChange}
						/>
					</div>
					{user?.role === "Project Manager" && (
						<CreateProject onOpenCreateModal={handleOpenCreateModal} />
					)}
				</div>

				{isLoading ? (
					<div className='flex justify-center items-center h-64'>
						<LoaderCircle className='w-12 h-12 animate-spin text-[var(--color-primary)]' />
					</div>
				) : projects.length > 0 ? (
					<>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
							{projects.map((project) => (
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
				) : (
					<div className='text-center py-16 text-gray-500'>
						<h3 className='text-xl font-semibold'>Tidak Ada Proyek</h3>
						<p>Tidak ada proyek yang sesuai dengan filter yang dipilih.</p>
					</div>
				)}
			</div>

			<ProjectFormModal
				isOpen={isFormModalOpen}
				onClose={() => setIsFormModalOpen(false)}
				onSaveSuccess={handleFormSaveSuccess}
				projectToEdit={projectToEdit}
			/>

			{projectToDelete && (
				<DeleteConfirmationModal
					isOpen={isDeleteModalOpen}
					onClose={() => setIsDeleteModalOpen(false)}
					onConfirm={handleDeleteConfirm}
					isLoading={false}
					itemName={projectToDelete.title}
				/>
			)}
		</>
	);
}
