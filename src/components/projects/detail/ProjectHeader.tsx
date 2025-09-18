"use client";

import { useState } from "react";
import {
	Button,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Tabs,
	Tab,
	Input,
} from "@heroui/react";
import {
	Pencil,
	ChevronDown,
	FileText,
	ListTodo,
	BarChart2,
	Check,
	X,
	Shapes,
} from "lucide-react";
import type {
	Project,
	ProjectFormData,
	ProjectStatus,
} from "@/src/types/project";
import type { User } from "@/src/types/auth";
import { projectService } from "@/src/services/projectService";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext"; // Import toast hook
import type { Selection } from "@react-types/shared";

type ProjectTab = "detail" | "daftar" | "category" | "laporan";

interface ProjectHeaderProps {
	project: Project;
	user: User;
	activeTab: ProjectTab;
	setActiveTab: (tab: ProjectTab) => void;
	onProjectUpdate: () => void;
}

const statusOptions: {
	key: ProjectStatus;
	label: string;
	color: string;
	dotColor: string;
	iconBg: string;
}[] = [
	{
		key: "tender",
		label: "Pengajuan",
		color: "bg-yellow-100 text-yellow-800 border-yellow-200",
		dotColor: "bg-yellow-500",
		iconBg: "bg-orange-500",
	},
	{
		key: "active",
		label: "Aktif",
		color: "bg-blue-100 text-blue-800 border-blue-200",
		dotColor: "bg-blue-500",
		iconBg: "bg-blue-500",
	},
	{
		key: "completed",
		label: "Selesai",
		color: "bg-green-100 text-green-800 border-green-200",
		dotColor: "bg-green-500",
		iconBg: "bg-green-500",
	},
	{
		key: "cancel",
		label: "Dibatalkan",
		color: "bg-red-100 text-red-800 border-red-200",
		dotColor: "bg-red-500",
		iconBg: "bg-red-500",
	},
];

const tabs = [
	{
		key: "detail",
		label: "Detail",
		icon: FileText,
		roles: ["Admin", "Project Manager", "Team Member"],
	},
	{
		key: "daftar",
		label: "Daftar Tugas",
		icon: ListTodo,
		roles: ["Admin", "Project Manager", "Team Member"],
	},
	{
		key: "category",
		label: "Kategori",
		icon: Shapes,
		roles: ["Admin", "Project Manager", "Team Member"],
	},
	{
		key: "laporan",
		label: "Laporan",
		icon: BarChart2,
		roles: ["Admin", "Project Manager"],
	},
];

export default function ProjectHeader({
	project,
	user,
	activeTab,
	setActiveTab,
	onProjectUpdate,
}: ProjectHeaderProps) {
	const { token } = useAuth();
	const { showToast } = useAppToast();
	const isPM = user.role === "Project Manager";

	const [isEditingTitle, setIsEditingTitle] = useState(false);
	const [newTitle, setNewTitle] = useState(project.title);

	const currentStatus =
		statusOptions.find((s) => s.key === project.status) || statusOptions[0];

	const handleUpdateProject = async (
		updates: Partial<ProjectFormData>,
		feedback: { loading: string; success: string; errorPrefix: string }
	) => {
		if (!token) return;

		const projectData: ProjectFormData = {
			title: project.title,
			description: project.description || undefined,
			start_date: project.start_date || undefined,
			end_date: project.end_date || undefined,
			status: project.status,
			...updates,
		};

		const updatePromise = projectService.updateProject(
			token,
			project.id.toString(),
			projectData
		);

		showToast(updatePromise, {
			loading: feedback.loading,
			success: () => {
				onProjectUpdate();
				return feedback.success;
			},
			error: (err: Error) => `${feedback.errorPrefix}: ${err.message}`,
		});
	};

	const handleTitleSave = () => {
		if (newTitle && newTitle !== project.title) {
			handleUpdateProject(
				{ title: newTitle },
				{
					loading: "Memperbarui judul proyek...",
					success: "Judul proyek berhasil diperbarui.",
					errorPrefix: "Gagal memperbarui judul",
				}
			);
		}
		setIsEditingTitle(false);
	};

	const handleStatusChange = (keys: Selection) => {
		const newStatus = Array.from(keys)[0] as ProjectStatus;
		const newStatusLabel =
			statusOptions.find((s) => s.key === newStatus)?.label || "";
		if (newStatus !== project.status) {
			handleUpdateProject(
				{ status: newStatus },
				{
					loading: "Memperbarui status proyek...",
					success: `Status proyek berhasil diubah menjadi "${newStatusLabel}".`,
					errorPrefix: "Gagal memperbarui status",
				}
			);
		}
	};

	const availableTabs = tabs.filter((tab) => tab.roles.includes(user.role));

	return (
		<>
			<div className='flex justify-between items-center'>
				<div className='flex items-center gap-2 flex-1'>
					{isEditingTitle ? (
						<div className='flex items-center gap-2 w-full max-w-md'>
							<Input
								value={newTitle}
								onValueChange={setNewTitle}
								variant='underlined'
								className='text-3xl font-bold'
								autoFocus
								onKeyDown={(e) => {
									if (e.key === "Enter") handleTitleSave();
									if (e.key === "Escape") setIsEditingTitle(false);
								}}
							/>
							<Button isIconOnly variant='light' size='sm' onPress={handleTitleSave}>
								<Check className='text-green-500' />
							</Button>
							<Button
								isIconOnly
								variant='light'
								size='sm'
								onPress={() => {
									setIsEditingTitle(false);
									setNewTitle(project.title);
								}}>
								<X className='text-red-500' />
							</Button>
						</div>
					) : (
						<div className='flex items-center gap-3'>
							<h1 className='text-3xl font-bold text-text-main'>{project.title}</h1>
							{isPM && (
								<Button
									isIconOnly
									variant='light'
									size='sm'
									onPress={() => setIsEditingTitle(true)}>
									<Pencil className='text-gray-500 hover:text-[var(--color-primary)]' />
								</Button>
							)}
						</div>
					)}
				</div>
				{isPM ? (
					<Dropdown>
						<DropdownTrigger>
							<Button
								startContent={
									<span
										className={`w-4 h-4 rounded-md ${
											project.status === "tender"
												? "bg-[var(--color-primary)]"
												: currentStatus.dotColor
										}`}
									/>
								}
								endContent={<ChevronDown size={16} />}
								className={`${
									project.status === "tender"
										? "bg-yellow-100 text-yellow-800 border-yellow-200"
										: currentStatus.color
								} font-semibold border`}>
								{currentStatus.label}
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							aria-label='Ubah Status Proyek'
							selectionMode='single'
							selectedKeys={[project.status]}
							onSelectionChange={handleStatusChange}>
							{statusOptions.map((status) => (
								<DropdownItem
									key={status.key}
									startContent={
										<span className={`w-4 h-4 rounded-md ${status.iconBg}`} />
									}>
									{status.label}
								</DropdownItem>
							))}
						</DropdownMenu>
					</Dropdown>
				) : (
					<div
						className={`flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-full ${currentStatus.color}`}>
						<span className={`w-2 h-2 rounded-full ${currentStatus.dotColor}`} />
						{currentStatus.label}
					</div>
				)}
			</div>
			<div className='mt-4 border-b border-gray-200'>
				<Tabs
					aria-label='Navigasi Proyek'
					selectedKey={activeTab}
					onSelectionChange={(key) => setActiveTab(key as ProjectTab)}
					classNames={{
						tabList: "p-0 bg-transparent gap-4",
						cursor:
							"w-full bg-[var(--color-primary)] text-[var(--color-primary)] h-0.5 rounded-t-lg",
						tab: "px-1 py-3 h-auto",
						tabContent:
							"group-data-[selected=true]:text-[var(--color-primary)] text-gray-500 font-semibold",
					}}>
					{availableTabs.map((tab) => (
						<Tab
							key={tab.key}
							title={
								<div className='flex items-center gap-2'>
									<tab.icon size={18} />
									<span>{tab.label}</span>
								</div>
							}
						/>
					))}
				</Tabs>
			</div>
		</>
	);
}
