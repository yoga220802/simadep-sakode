"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { projectService } from "@/src/services/projectService";
import type { Project, ProjectStatus } from "@/src/types/project";
import ProjectCard from "@/src/components/projects/ProjectCard";
import CreateProject from "@/src/components/projects/CreateProject";
import Pagination from "@/src/components/common/Pagination";
import { LoaderCircle } from "lucide-react";

const filterTabsConfig = {
	Admin: [
		{ label: "Semua", value: "all" as const },
		{ label: "Pengajuan", value: "tender" as const },
		{ label: "Aktif", value: "active" as const },
		{ label: "Selesai", value: "completed" as const },
		{ label: "Dibatalkan", value: "cancel" as const },
	],
	"Project Manager": [
		{ label: "Semua", value: "all" as const },
		{ label: "Pengajuan", value: "tender" as const },
		{ label: "Aktif", value: "active" as const },
		{ label: "Selesai", value: "completed" as const },
		{ label: "Dibatalkan", value: "cancel" as const },
	],
	"Team Member": [
		{ label: "Semua", value: "all" as const },
		{ label: "Aktif", value: "active" as const },
		{ label: "Selesai", value: "completed" as const },
	],
	Viewer: [],
};

const ITEMS_PER_PAGE = 10;

export default function ProjectsPage() {
	const { user, token } = useAuth();
	const [allProjects, setAllProjects] = useState<Project[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeFilter, setActiveFilter] = useState<ProjectStatus | "all">("all");
	const [currentPage, setCurrentPage] = useState(1);

	const availableFilters = user
		? filterTabsConfig[user.role as keyof typeof filterTabsConfig]
		: [];

	const fetchAllProjects = async () => {
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
	};

	useEffect(() => {
		fetchAllProjects();
	}, [token]);

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
		allProjects.forEach((p) => counts[p.status]++);
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

	const handleFilterChange = (filter: ProjectStatus | "all") => {
		setActiveFilter(filter);
	};

	return (
		<div className='space-y-6'>
			<div className='flex justify-between items-center'>
				<div className='bg-gray-100 p-1.5 rounded-lg flex items-center gap-2'>
					{availableFilters.map((tab) => (
						<button
							key={tab.value}
							onClick={() => handleFilterChange(tab.value)}
							className={`py-2 px-4 rounded-md font-semibold transition-all duration-300 flex items-center gap-2 ${
								activeFilter === tab.value
									? "bg-white shadow-sm text-primary"
									: "text-gray-600 hover:bg-gray-200"
							}`}>
							{tab.label}
							<span
								className={`px-2 py-0.5 rounded-full text-sm font-bold ${
									activeFilter === tab.value
										? "bg-yellow-300 text-yellow-800"
										: "bg-gray-200 text-gray-700"
								}`}>
								{projectCounts[tab.value]}
							</span>
						</button>
					))}
				</div>
				{user?.role === "Project Manager" && (
					<CreateProject onProjectCreated={fetchAllProjects} />
				)}
			</div>

			{isLoading ? (
				<div className='flex justify-center items-center h-64'>
					<LoaderCircle className='w-12 h-12 animate-spin text-primary' />
				</div>
			) : (
				<>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
						{paginatedProjects.map((project) => (
							<ProjectCard key={project.id} project={project} />
						))}
					</div>
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={setCurrentPage}
					/>
				</>
			)}
		</div>
	);
}
