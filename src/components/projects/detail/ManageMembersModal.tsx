"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useDebounce } from "use-debounce";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	User as HeroUser,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Autocomplete,
	AutocompleteItem,
	Spinner,
} from "@heroui/react";
import { projectService } from "@/src/services/projectService";
import { userService } from "@/src/services/userService";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext";
import type { Project, ProjectMember, ProjectRole } from "@/src/types/project";
import type { UserSummary } from "@/src/types/user";
import { ChevronDown, Trash2, LoaderCircle } from "lucide-react";
import { RoleBadge } from "@/src/components/dashboard/InfoTable";
import type { Role } from "@/src/types/auth";

interface ManageMembersModalProps {
	isOpen: boolean;
	onClose: () => void;
	project: Project;
	onMembersUpdate: () => void;
}

const roleOptions: { key: ProjectRole; label: string }[] = [
	{ key: "owner", label: "Owner" },
	{ key: "contributor", label: "Contributor" },
	{ key: "viewer", label: "Viewer" },
];

const mapApiRoleToDisplayRole = (apiRole: UserSummary["role"]): Role => {
	switch (apiRole) {
		case "admin":
			return "Admin";
		case "project_manager":
			return "Project Manager";
		case "team_member":
			return "Team Member";
		default:
			return "Viewer";
	}
};

// Helper function untuk membuat URL avatar yang bersih
const createSafeAvatarUrl = (member: {
	profile_url: string;
	name: string;
	email: string;
}): string => {
	if (member.profile_url && !member.profile_url.includes("ui-avatars.com")) {
		return member.profile_url;
	}
	const nameForAvatar = (member.name || member.email).split("@")[0];
	const url = new URL("https://ui-avatars.com/api/");
	url.searchParams.set("name", nameForAvatar);
	url.searchParams.set("background", "E4E7EC");
	url.searchParams.set("color", "3B4852");
	url.searchParams.set("bold", "true");
	url.searchParams.set("size", "256");
	return url.toString();
};

export default function ManageMembersModal({
	isOpen,
	onClose,
	project,
	onMembersUpdate,
}: ManageMembersModalProps) {
	const { token } = useAuth();
	const { showToast } = useAppToast();
	const [availableUsers, setAvailableUsers] = useState<UserSummary[]>([]);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [selectedRole, setSelectedRole] = useState<ProjectRole>("contributor");
	const [isLoading, setIsLoading] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchValue, setSearchValue] = useState("");
	const [debouncedSearchValue] = useDebounce(searchValue, 500);

	const fetchAvailableUsers = useCallback(async () => {
		if (isOpen && token) {
			setIsSearching(true);
			setError(null);
			try {
				const allSystemUsers = await userService.getAllUsers(
					token,
					debouncedSearchValue
				);
				// Filter out users who are already members of the project
				const currentMemberIds = new Set(project.members?.map((m) => m.user_id));
				const usersNotInProject = allSystemUsers.filter(
					(user) => !currentMemberIds.has(user.id)
				);
				setAvailableUsers(usersNotInProject);
			} catch (err) {
				setError("Gagal memuat daftar pengguna.");
			} finally {
				setIsSearching(false);
			}
		}
	}, [isOpen, token, debouncedSearchValue, project.members]);

	useEffect(() => {
		fetchAvailableUsers();
	}, [fetchAvailableUsers]);

	const handleAction = async (
		action: "add" | "remove" | "update",
		member: { userId: number; name: string },
		role?: ProjectRole
	) => {
		if (!token) return;
		setIsLoading(true);
		setError(null);

		let promise: Promise<{ message: string } | void>;
		let loadingTitle = "";
		let successDesc = "";
		let errorPrefix = "";

		const projectId = project.id.toString();

		switch (action) {
			case "add":
				if (!role || !selectedUserId) return;
				loadingTitle = `Menambahkan ${member.name} ke proyek...`;
				successDesc = `${member.name} berhasil ditambahkan ke proyek.`;
				errorPrefix = "Gagal menambahkan anggota";
				promise = projectService.addMemberToProject(
					token,
					projectId,
					parseInt(selectedUserId, 10),
					role
				);
				break;
			case "remove":
				loadingTitle = `Menghapus ${member.name} dari proyek...`;
				successDesc = `${member.name} berhasil dihapus dari proyek.`;
				errorPrefix = "Gagal menghapus anggota";
				promise = projectService.removeMemberFromProject(
					token,
					projectId,
					member.userId
				);
				break;
			case "update":
				if (!role) return;
				loadingTitle = `Memperbarui peran ${member.name}...`;
				successDesc = `Peran untuk ${member.name} berhasil diperbarui.`;
				errorPrefix = "Gagal memperbarui peran";
				promise = projectService.updateMemberRole(
					token,
					projectId,
					member.userId,
					role
				);
				break;
			default:
				setIsLoading(false);
				return;
		}

		showToast(promise, {
			loading: loadingTitle,
			success: () => {
				onMembersUpdate();
				if (action === "add") {
					setSelectedUserId(null);
					setSearchValue(""); // Reset search on success
				}
				return successDesc;
			},
			error: (err: Error) => `${errorPrefix}: ${err.message}`,
		});

		try {
			await promise;
		} catch (err) {
			// Error is handled by toast
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={onClose}
			size='2xl'
			placement='center'
			backdrop='blur'>
			<ModalContent className='bg-white'>
				{(onClose) => (
					<>
						<ModalHeader className='flex flex-col gap-1'>
							Kelola Anggota Proyek
						</ModalHeader>
						<ModalBody className='max-h-[60vh] overflow-y-auto'>
							<div className='p-4 bg-gray-50 rounded-lg'>
								<h3 className='font-semibold mb-2'>Tambahkan Anggota Baru</h3>
								<div className='flex items-center gap-2'>
									<Autocomplete
										label='Cari Nama atau Email Pegawai'
										items={availableUsers}
										selectedKey={selectedUserId}
										onSelectionChange={(key) => setSelectedUserId(key as string)}
										inputValue={searchValue}
										onInputChange={setSearchValue}
										className='flex-1'
										isLoading={isSearching}>
										{(user) => (
											<AutocompleteItem key={user.id} textValue={user.name}>
												<div className='flex items-center gap-3'>
													<Image
														src={createSafeAvatarUrl(user)}
														alt={user.name}
														width={40}
														height={40}
														className='rounded-full'
													/>
													<div className='flex flex-col'>
														<span className='font-semibold'>{user.name}</span>
														<span className='text-xs text-gray-500'>{user.email}</span>
													</div>
													<RoleBadge
														role={mapApiRoleToDisplayRole(user.role)}
														size='small'
													/>
												</div>
											</AutocompleteItem>
										)}
									</Autocomplete>
									<Dropdown>
										<DropdownTrigger>
											<Button endContent={<ChevronDown size={16} />}>
												{roleOptions.find((r) => r.key === selectedRole)?.label}
											</Button>
										</DropdownTrigger>
										<DropdownMenu
											selectionMode='single'
											selectedKeys={[selectedRole]}
											onSelectionChange={(keys) =>
												setSelectedRole(Array.from(keys)[0] as ProjectRole)
											}>
											{roleOptions.map((r) => (
												<DropdownItem key={r.key}>{r.label}</DropdownItem>
											))}
										</DropdownMenu>
									</Dropdown>
									<Button
										color='primary'
										className='bg-[var(--color-primary)] text-white'
										onPress={() => {
											const selectedUser = availableUsers.find(
												(u) => u.id.toString() === selectedUserId
											);
											if (selectedUser) {
												handleAction(
													"add",
													{
														userId: selectedUser.id,
														name: selectedUser.name,
													},
													selectedRole
												);
											}
										}}
										isDisabled={!selectedUserId || isLoading}>
										{isLoading ? <LoaderCircle className='animate-spin' /> : "Tambah"}
									</Button>
								</div>
							</div>

							{error && (
								<p className='text-sm text-red-500 text-center mt-2'>{error}</p>
							)}

							<div className='mt-6 space-y-2'>
								{(project.members ?? []).map((member) => (
									<div
										key={member.user_id}
										className='flex items-center justify-between p-2 rounded-lg hover:bg-gray-100'>
										<HeroUser
											name={member.name}
											description={member.email}
											avatarProps={{
												src: createSafeAvatarUrl(member),
											}}
										/>
										<div className='flex items-center gap-2'>
											<Dropdown>
												<DropdownTrigger>
													<Button
														size='sm'
														variant='bordered'
														endContent={<ChevronDown size={16} />}
														isDisabled={isLoading}>
														{roleOptions.find((r) => r.key === member.project_role)?.label}
													</Button>
												</DropdownTrigger>
												<DropdownMenu
													selectionMode='single'
													selectedKeys={[member.project_role]}
													onSelectionChange={(keys) =>
														handleAction(
															"update",
															{ userId: member.user_id, name: member.name },
															Array.from(keys)[0] as ProjectRole
														)
													}>
													{roleOptions.map((r) => (
														<DropdownItem key={r.key}>{r.label}</DropdownItem>
													))}
												</DropdownMenu>
											</Dropdown>
											<Button
												isIconOnly
												size='sm'
												variant='light'
												color='danger'
												onPress={() =>
													handleAction("remove", {
														userId: member.user_id,
														name: member.name,
													})
												}
												isDisabled={isLoading}>
												<Trash2 size={16} />
											</Button>
										</div>
									</div>
								))}
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='danger' variant='light' onPress={onClose}>
								Tutup
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
