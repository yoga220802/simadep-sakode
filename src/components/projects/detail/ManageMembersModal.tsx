"use client";

import { useState, useEffect } from "react";
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
} from "@heroui/react";
import { projectService } from "@/src/services/projectService";
import { userService } from "@/src/services/userService";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext"; // Import toast hook
import type { Project, ProjectMember, ProjectRole } from "@/src/types/project";
import type { UserSummary } from "@/src/types/user";
import { ChevronDown, Trash2, LoaderCircle } from "lucide-react";

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

export default function ManageMembersModal({
	isOpen,
	onClose,
	project,
	onMembersUpdate,
}: ManageMembersModalProps) {
	const { token } = useAuth();
	const { showToast } = useAppToast(); // Gunakan toast
	const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [selectedRole, setSelectedRole] = useState<ProjectRole>("contributor");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isOpen && token) {
			userService
				.getUsers(token)
				.then((data) => setAllUsers(data.items))
				.catch(() => setError("Gagal memuat daftar pengguna."));
		}
	}, [isOpen, token]);

	const handleAction = async (
		action: "add" | "remove" | "update",
		member: { userId: number; name: string },
		role?: ProjectRole
	) => {
		if (!token) return;
		setIsLoading(true);
		setError(null);

		let promise: Promise<any>;
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
				return;
		}

		showToast(promise, {
			loading: loadingTitle,
			success: () => {
				onMembersUpdate();
				if (action === "add") {
					setSelectedUserId(null);
				}
				return ( successDesc );
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

	const availableUsers = allUsers.filter(
		(user) => !(project.members ?? []).some((member) => member.user_id === user.id)
	);

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
										label='Pilih Pegawai'
										items={availableUsers}
										selectedKey={selectedUserId}
										onSelectionChange={(key) => setSelectedUserId(key as string)}
										className='flex-1'>
										{(user) => (
											<AutocompleteItem key={user.id} textValue={user.name}>
												{user.name} ({user.email})
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
											const selectedUser = allUsers.find(
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
												src: `https://randomuser.me/api/portraits/lego/${
													member.user_id % 9
												}.jpg`,
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
