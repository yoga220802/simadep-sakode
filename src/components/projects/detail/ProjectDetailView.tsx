"use client";

import { useState } from "react";
import {
	Button,
	Tooltip,
	User as HeroUser,
	useDisclosure,
	Textarea,
} from "@heroui/react";
import { Pencil, Plus, Calendar } from "lucide-react";
import type {
	Project,
	ProjectFormData,
	ProjectMember,
} from "@/src/types/project";
import type { User } from "@/src/types/auth";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import ManageMembersModal from "./ManageMembersModal";
import EditScheduleModal from "./EditScheduleModal";
import { projectService } from "@/src/services/projectService";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext";

interface ProjectDetailViewProps {
	project: Project;
	user: User;
	onDataUpdate: () => void;
}

const formatDate = (dateString: string | null) => {
	if (!dateString) return "Belum ditentukan";
	try {
		return format(new Date(dateString), "d MMMM yyyy", { locale: id });
	} catch {
		return "Format tidak valid";
	}
};

// Helper function untuk membuat URL avatar yang bersih
const createSafeAvatarUrl = (member: ProjectMember): string => {
	// Prioritaskan profile_url jika ada dan BUKAN dari ui-avatars
	if (member.profile_url && !member.profile_url.includes("ui-avatars.com")) {
		return member.profile_url;
	}

	// Jika tidak, selalu buat URL baru dari ui-avatars menggunakan nama/email
	const nameForAvatar = (member.name || member.email).includes("@")
		? (member.name || member.email).split("@")[0]
		: member.name || member.email;

	const url = new URL("https://ui-avatars.com/api/");
	url.searchParams.set("name", nameForAvatar);
	url.searchParams.set("background", "random");
	url.searchParams.set("bold", "true");
	url.searchParams.set("size", "256");
	return url.toString();
};

export default function ProjectDetailView({
	project,
	user,
	onDataUpdate,
}: ProjectDetailViewProps) {
	const { token } = useAuth();
	const { showToast } = useAppToast();
	const isPM = user.role === "Project Manager";

	const {
		isOpen: isMembersModalOpen,
		onOpen: onMembersModalOpen,
		onClose: onMembersModalClose,
	} = useDisclosure();
	const {
		isOpen: isScheduleModalOpen,
		onOpen: onScheduleModalOpen,
		onClose: onScheduleModalClose,
	} = useDisclosure();

	const [isEditingDesc, setIsEditingDesc] = useState(false);
	const [newDesc, setNewDesc] = useState(project.description || "");

	const handleDescSave = async () => {
		if (!token) {
			setIsEditingDesc(false);
			return;
		}

		const projectData: ProjectFormData = {
			title: project.title,
			description: newDesc,
			start_date: project.start_date || undefined,
			end_date: project.end_date || undefined,
			status: project.status,
		};

		const savePromise = projectService.updateProject(
			token,
			project.id.toString(),
			projectData
		);

		showToast(savePromise, {
			loading: "Menyimpan deskripsi...",
			success: () => {
				onDataUpdate();
				setIsEditingDesc(false);
				return "Deskripsi proyek berhasil diperbarui.";
			},
			error: (err: Error) => `Gagal memperbarui deskripsi: ${err.message}`,
		});
	};

	return (
		<>
			<div className='space-y-10'>
				{/* Bagian Deskripsi */}
				<div>
					<div className='flex justify-between items-center mb-3'>
						<h2 className='text-xl font-bold text-text-main'>Deskripsi Proyek</h2>
						{isPM && !isEditingDesc && (
							<Button
								isIconOnly
								variant='light'
								size='sm'
								onPress={() => setIsEditingDesc(true)}>
								<Pencil className='text-gray-500 hover:text-[var(--color-primary)]' />
							</Button>
						)}
					</div>
					{isEditingDesc ? (
						<div className='space-y-2'>
							<Textarea
								value={newDesc}
								onValueChange={setNewDesc}
								autoFocus
								classNames={{ inputWrapper: "min-h-32" }}
							/>
							<div className='flex justify-end gap-2'>
								<Button
									size='sm'
									variant='light'
									color='danger'
									onPress={() => {
										setIsEditingDesc(false);
										setNewDesc(project.description || "");
									}}>
									Batal
								</Button>
								<Button
									size='sm'
									color='primary'
									className='bg-[var(--color-primary)] text-white'
									onPress={handleDescSave}>
									Simpan
								</Button>
							</div>
						</div>
					) : (
						<p className='text-gray-600 leading-relaxed'>
							{project.description || (
								<span className='italic text-gray-400'>
									Tidak ada deskripsi untuk proyek ini.
								</span>
							)}
						</p>
					)}
				</div>

				{/* Bagian Jadwal */}
				<div>
					<div className='flex justify-between items-center mb-4'>
						<h2 className='text-xl font-bold text-text-main'>Jadwal Proyek</h2>
						{isPM && (
							<Button
								isIconOnly
								variant='light'
								size='sm'
								onPress={onScheduleModalOpen}>
								<Pencil className='text-gray-500 hover:text-[var(--color-primary)]' />
							</Button>
						)}
					</div>
					<div className='flex items-center gap-8 text-gray-700'>
						<div className='flex items-center gap-3'>
							<Calendar className='text-[var(--color-primary)]' />
							<div>
								<p className='text-sm text-gray-500'>Tanggal Mulai</p>
								<p className='font-semibold'>{formatDate(project.start_date)}</p>
							</div>
						</div>
						<div className='flex items-center gap-3'>
							<Calendar className='text-red-500' />
							<div>
								<p className='text-sm text-gray-500'>Tanggal Selesai</p>
								<p className='font-semibold'>{formatDate(project.end_date)}</p>
							</div>
						</div>
					</div>
				</div>

				{/* Bagian Kolaborasi */}
				<div>
					<h2 className='text-xl font-bold text-text-main mb-4'>
						Kolaborasi Proyek
					</h2>
					<div className='flex flex-wrap items-center gap-x-8 gap-y-4'>
						{isPM && (
							<button
								onClick={onMembersModalOpen}
								className='flex items-center gap-3 group'>
								<div className='w-12 h-12 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 group-hover:bg-gray-200 flex items-center justify-center transition-colors'>
									<Plus className='text-gray-500' />
								</div>
								<span className='font-semibold text-gray-700'>Tambahkan Anggota</span>
							</button>
						)}
						{project?.members?.map((member) => (
							<Tooltip
								key={member.user_id}
								content={
									<div>
										<p className='font-bold'>{member.name}</p>
										<p className='text-sm'>{member.email}</p>
									</div>
								}>
								<div className='cursor-pointer'>
									<HeroUser
										name={member.name}
										description={
											member.project_role.charAt(0).toUpperCase() +
											member.project_role.slice(1)
										}
										avatarProps={{
											src: createSafeAvatarUrl(member), // Gunakan fungsi helper kita
										}}
									/>
								</div>
							</Tooltip>
						))}
					</div>
				</div>
			</div>

			<ManageMembersModal
				isOpen={isMembersModalOpen}
				onClose={onMembersModalClose}
				project={project}
				onMembersUpdate={() => {
					onDataUpdate();
					onMembersModalClose();
				}}
			/>
			<EditScheduleModal
				isOpen={isScheduleModalOpen}
				onClose={onScheduleModalClose}
				project={project}
				onProjectUpdate={() => {
					onDataUpdate();
					onScheduleModalClose();
				}}
			/>
		</>
	);
}
