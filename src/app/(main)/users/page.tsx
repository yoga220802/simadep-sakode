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
	Spinner,
} from "@heroui/react";
import { Search, ChevronDown } from "lucide-react";
import { AvatarCell, RoleBadge } from "@/src/components/dashboard/InfoTable";
import type { Role } from "@/src/types/auth";
import type { Selection, SortDescriptor } from "@react-types/shared";
import { useAppToast } from "@/src/context/ToastContext";
import UserRoleFilter from "@/src/components/users/UserRoleFilter";
import { useDebounce } from "use-debounce";

const COLUMNS = [
	{ key: "name", label: "NAMA", allowsSorting: true },
	{ key: "position", label: "JABATAN" },
	{ key: "email", label: "EMAIL", allowsSorting: true },
	{ key: "role", label: "ROLE" },
];

const ITEMS_PER_PAGE = 10;

const API_ROLE_MAP: Record<Role | "Semua", UserSummary["role"] | "all"> = {
	Admin: "admin",
	"Project Manager": "project_manager",
	"Team Member": "team_member",
	Viewer: "team_member",
	Semua: "all",
};

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

const roleOptions: (Role | "Semua")[] = [
	"Semua",
	"Admin",
	"Project Manager",
	"Team Member",
];

export default function UsersPage() {
	const { user: currentUser, token } = useAuth();
	const { showToast } = useAppToast();

	const [allUsers, setAllUsers] = useState<UserSummary[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
		column: "name",
		direction: "ascending",
	});

	const [searchValue, setSearchValue] = useState("");
	const [debouncedSearchValue] = useDebounce(searchValue, 300);
	const [roleFilter, setRoleFilter] = useState<Selection>(new Set(["Semua"]));
	const [currentPage, setCurrentPage] = useState(1);
	const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

	const fetchAllUsers = useCallback(async () => {
		if (!token) return;
		setIsLoading(true);
		try {
			// Ambil semua user dengan per_page yang besar
			const data = await userService.getUsers(
				token,
				1,
				1000,
				debouncedSearchValue
			);
			setAllUsers(data.items);
		} catch (error) {
			showToast(
				error instanceof Error ? error.message : "Gagal memuat pengguna.",
				"error"
			);
		} finally {
			setIsLoading(false);
		}
	}, [token, showToast, debouncedSearchValue]);

	useEffect(() => {
		fetchAllUsers();
	}, [fetchAllUsers]);

	const handleRoleChange = async (
		userId: number,
		userName: string,
		newDisplayRole: Role
	) => {
		if (!token || !currentUser) return;
		const newApiRole = API_ROLE_MAP[newDisplayRole];
		if (!newApiRole || newApiRole === "all") return;

		setUpdatingUserId(userId);

		const promise = userService.updateUserRole(
			token,
			userId,
			newApiRole as UserSummary["role"]
		);

		showToast(promise, {
			loading: `Memperbarui role untuk ${userName}...`,
			success: () => {
				fetchAllUsers(); // Muat ulang semua data setelah berhasil
				return `Role untuk ${userName} berhasil diubah.`;
			},
			error: (err: Error) => `Gagal memperbarui role: ${err.message}`,
		});

		try {
			await promise;
		} finally {
			setUpdatingUserId(null);
		}
	};

	const filteredAndSortedUsers = useMemo(() => {
		let filtered = [...allUsers];
		const selectedRole = Array.from(roleFilter)[0];

		if (selectedRole && selectedRole !== "Semua") {
			const apiRole = API_ROLE_MAP[selectedRole as Role];
			filtered = filtered.filter((user) => user.role === apiRole);
		}

		const { column, direction } = sortDescriptor;
		if (column) {
			filtered.sort((a, b) => {
				const key = column as keyof UserSummary;
				const first = a[key] as string;
				const second = b[key] as string;
				let cmp = first.localeCompare(second, "id-ID", { numeric: true });
				if (direction === "descending") {
					cmp *= -1;
				}
				return cmp;
			});
		}

		return filtered;
	}, [allUsers, roleFilter, sortDescriptor]);

	const totalPages = Math.ceil(filteredAndSortedUsers.length / ITEMS_PER_PAGE);
	const paginatedUsers = useMemo(() => {
		const start = (currentPage - 1) * ITEMS_PER_PAGE;
		const end = start + ITEMS_PER_PAGE;
		return filteredAndSortedUsers.slice(start, end);
	}, [filteredAndSortedUsers, currentPage]);

	useEffect(() => {
		if (currentPage > 1 && paginatedUsers.length === 0) {
			setCurrentPage(1);
		}
	}, [filteredAndSortedUsers, currentPage, paginatedUsers.length]);

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
				return (
					<Dropdown>
						<DropdownTrigger>
							<Button
								variant='light'
								endContent={!isCurrentUser && <ChevronDown size={16} />}
								isLoading={updatingUserId === user.id}
								isDisabled={isCurrentUser}
								className='disabled:opacity-100'>
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
							{["Admin", "Project Manager", "Team Member"].map((roleOption) => (
								<DropdownItem key={roleOption}>{roleOption as Role}</DropdownItem>
							))}
						</DropdownMenu>
					</Dropdown>
				);
			default:
				const value = user[columnKey as keyof UserSummary];
				return typeof value === "string" ? value : "";
		}
	};

	return (
		<div className='bg-white p-6 rounded-xl border-2 border-gray-200'>
			<div className='flex justify-between items-center mb-6'>
				<h1 className='text-3xl font-bold text-text-main'>Pegawai</h1>
				<div className='flex items-center gap-4'>
					<UserRoleFilter
						selectedRole={roleFilter}
						onRoleChange={setRoleFilter}
						roleOptions={roleOptions}
					/>
					<Input
						isClearable
						className='w-full sm:max-w-xs'
						placeholder='Cari nama atau email...'
						startContent={<Search />}
						value={searchValue}
						onClear={() => setSearchValue("")}
						onValueChange={setSearchValue}
					/>
				</div>
			</div>

			<Table
				aria-label='Tabel Daftar Pegawai'
				sortDescriptor={sortDescriptor}
				onSortChange={setSortDescriptor}>
				<TableHeader columns={COLUMNS}>
					{(column) => (
						<TableColumn key={column.key} allowsSorting={column.allowsSorting}>
							{column.label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody
					items={paginatedUsers}
					isLoading={isLoading}
					loadingContent={<Spinner label='Memuat...' />}>
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
						classNames={{
							item: "text-[var(--color-primary)] data-[active=true]:text-white",
							prev: "text-[var(--color-primary)]",
							next: "text-[var(--color-primary)]",
							cursor: "bg-[var(--color-primary)]"
						}}
					/>
				</div>
			)}
		</div>
	);
}
