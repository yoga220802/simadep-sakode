"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { userService } from "@/src/services/userService";
import type { UserSummary } from "@/src/types/user";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Input,
	Pagination,
	Dropdown,
	DropdownTrigger,
	Button,
	DropdownMenu,
	DropdownItem,
} from "@heroui/react";
import { Search, ChevronDown } from "lucide-react";
import { AvatarCell, RoleBadge } from "@/src/components/dashboard/InfoTable";
import type { Role } from "@/src/types/auth";
import type { Selection } from "@react-types/shared";
import { useAppToast } from "@/src/context/ToastContext";

const COLUMNS = [
	{ key: "name", label: "NAMA" },
	{ key: "position", label: "JABATAN" },
	{ key: "email", label: "EMAIL" },
	{ key: "role", label: "ROLE" },
];

const ITEMS_PER_PAGE = 10;

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

const mapDisplayRoleToApiRole = (
	displayRole: Role
): UserSummary["role"] | null => {
	switch (displayRole) {
		case "Admin":
			return "admin";
		case "Project Manager":
			return "project_manager";
		case "Team Member":
			return "team_member";
		default:
			return null;
	}
};

const roleOptions: Role[] = ["Admin", "Project Manager", "Team Member"];

export default function UsersPage() {
	const { user: currentUser, token } = useAuth();
	const { showToast } = useAppToast();
	const [users, setUsers] = useState<UserSummary[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [filterValue, setFilterValue] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

	const fetchUsers = useCallback(async () => {
		if (token) {
			setIsLoading(true);
			try {
				const data = await userService.getUsers(token, 1, 100);
				setUsers(data.items);
			} catch (error) {
				console.error("Gagal mengambil data pegawai:", error);
			} finally {
				setIsLoading(false);
			}
		}
	}, [token]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const handleRoleChange = async (
		userId: number,
		userName: string,
		newDisplayRole: Role
	) => {
		if (!token) return;
		const newApiRole = mapDisplayRoleToApiRole(newDisplayRole);
		if (!newApiRole) return;

		setUpdatingUserId(userId);

		try {
			await userService.updateUserRole(token, userId, newApiRole);
			setUsers((currentUsers) =>
				currentUsers.map((user) =>
					user.id === userId ? { ...user, role: newApiRole } : user
				)
			);
			showToast(
				`Role untuk ${userName} berhasil diubah menjadi ${newDisplayRole}.`,
				"success"
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Gagal memperbarui peran pengguna.";
			showToast(errorMessage, "error");
			console.error("Gagal mengubah role:", error);
		} finally {
			setUpdatingUserId(null);
		}
	};

	const filteredUsers = useMemo(() => {
		if (!filterValue) return users;
		return users.filter(
			(user) =>
				user.name.toLowerCase().includes(filterValue.toLowerCase()) ||
				user.email.toLowerCase().includes(filterValue.toLowerCase())
		);
	}, [users, filterValue]);

	const paginatedUsers = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		const end = start + ITEMS_PER_PAGE;
		return filteredUsers.slice(start, end);
	}, [filteredUsers, currentPage]);

	const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

	const renderCell = (user: UserSummary, columnKey: keyof UserSummary) => {
		const displayRole = mapApiRoleToDisplayRole(user.role);
		const isCurrentUser = currentUser?.id === user.id.toString();

		switch (columnKey) {
			case "name":
				return (
					<div className='flex items-center gap-3'>
						<AvatarCell src={user.profile_url} alt={user.name} />
						<span>{user.name}</span>
					</div>
				);
			case "role":
				if (isCurrentUser) {
					return <RoleBadge role={displayRole} />;
				}
				return (
					<Dropdown>
						<DropdownTrigger>
							<Button
								variant='light'
								endContent={<ChevronDown size={16} />}
								isLoading={updatingUserId === user.id}>
								<RoleBadge role={displayRole} />
							</Button>
						</DropdownTrigger>
						<DropdownMenu
							aria-label='Ubah Role'
							selectionMode='single'
							selectedKeys={[displayRole]}
							onSelectionChange={(keys: Selection) => {
								const newRole = Array.from(keys)[0] as Role;
								handleRoleChange(user.id, user.name, newRole);
							}}>
							{roleOptions.map((roleOption) => (
								<DropdownItem key={roleOption}>{roleOption}</DropdownItem>
							))}
						</DropdownMenu>
					</Dropdown>
				);
			default:
				return user[columnKey as keyof UserSummary];
		}
	};

	return (
		<div className='bg-white p-6 rounded-xl border-2 border-gray-200'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold text-text-main'>Pegawai</h1>
				<Input
					isClearable
					className='w-full sm:max-w-[44%]'
					placeholder='Search...'
					startContent={<Search />}
					value={filterValue}
					onClear={() => setFilterValue("")}
					onValueChange={setFilterValue}
				/>
			</div>

			<Table aria-label='Tabel Daftar Pegawai'>
				<TableHeader columns={COLUMNS}>
					{(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
				</TableHeader>
				<TableBody items={paginatedUsers} isLoading={isLoading}>
					{(item) => (
						<TableRow key={item.id}>
							{(columnKey) => (
								<TableCell>
									{renderCell(item, columnKey as keyof UserSummary)}
								</TableCell>
							)}
						</TableRow>
					)}
				</TableBody>
			</Table>

			{totalPages > 1 && (
				<div className='py-4 px-2 flex justify-center'>
					<Pagination
						showControls
						color='primary'
						page={currentPage}
						total={totalPages}
						onChange={setCurrentPage}
					/>
				</div>
			)}
		</div>
	);
}
