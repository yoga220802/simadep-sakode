"use client";

import type { User } from "@/src/types/auth";
import type { ProjectStatus } from "@/src/types/project";

interface FilterTab {
	label: string;
	value: ProjectStatus | "all";
}

const filterTabsConfig: Record<string, FilterTab[]> = {
	Admin: [
		{ label: "Semua", value: "all" },
		{ label: "Pengajuan", value: "tender" },
		{ label: "Aktif", value: "active" },
		{ label: "Selesai", value: "completed" },
		{ label: "Dibatalkan", value: "cancel" },
	],
	"Project Manager": [
		{ label: "Semua", value: "all" },
		{ label: "Pengajuan", value: "tender" },
		{ label: "Aktif", value: "active" },
		{ label: "Selesai", value: "completed" },
		{ label: "Dibatalkan", value: "cancel" },
	],
	"Team Member": [
		{ label: "Semua", value: "all" },
		{ label: "Aktif", value: "active" },
		{ label: "Selesai", value: "completed" },
	],
	Viewer: [],
};

interface ProjectFilterTabsProps {
	user: User | null;
	activeFilter: ProjectStatus | "all";
	onFilterChange: (filter: ProjectStatus | "all") => void;
	projectCounts: Record<ProjectStatus | "all", number>;
}

export default function ProjectFilterTabs({
	user,
	activeFilter,
	onFilterChange,
	projectCounts,
}: ProjectFilterTabsProps) {
	const availableFilters = user ? filterTabsConfig[user.role] : [];

	if (availableFilters.length === 0) {
		return null;
	}

	return (
		<div className='bg-gray-100 p-1.5 rounded-lg flex items-center gap-2'>
			{availableFilters.map((tab) => (
				<button
					key={tab.value}
					onClick={() => onFilterChange(tab.value)}
					className={`py-2 px-4 rounded-md font-semibold transition-all duration-300 flex items-center gap-2 ${
						activeFilter === tab.value
							? "bg-white shadow-sm text-[var(--color-primary)]"
							: "text-gray-600 hover:bg-gray-200"
					}`}>
					{tab.label}
					<span
						className={`px-2 py-0.5 rounded-full text-xs font-bold ${
							activeFilter === tab.value
								? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
								: "bg-gray-200 text-gray-700"
						}`}>
						{projectCounts[tab.value]}
					</span>
				</button>
			))}
		</div>
	);
}
