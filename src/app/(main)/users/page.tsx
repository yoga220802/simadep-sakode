"use client";

import { useEffect, useState, useMemo } from "react";
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
	Button,
	Pagination,
} from "@heroui/react";
import { Search, Pencil, Trash2 } from "lucide-react";
import { AvatarCell, RoleBadge } from "@/src/components/dashboard/InfoTable";
import type { Role } from "@/src/types/auth";

const COLUMNS = [
	{ key: "name", label: "NAMA" },
	{ key: "position", label: "JABATAN" },
	{ key: "email", label: "EMAIL" },
	{ key: "role", label: "ROLE" },
	{ key: "actions", label: "EDIT" },
];

const ITEMS_PER_PAGE = 10;

// Helper untuk mapping role dari API ke tampilan
const mapApiRoleToDisplayRole = (apiRole: UserSummary["role"]): Role => {
	switch (apiRole) {
		case "admin":
			return "Admin";
		case "project_manager":
			return "Project Manager";
		case "team_member":
			return "Team Member";
		default:
			return "Viewer"; // Fallback
	}
};

export default function UsersPage() {
	const { token } = useAuth();
	const [users, setUsers] = useState<UserSummary[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [filterValue, setFilterValue] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	useEffect(() => {
		const fetchUsers = async () => {
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
		};
		fetchUsers();
	}, [token]);

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

	const renderCell = (
		user: UserSummary,
		columnKey: keyof UserSummary | "actions"
	) => {
		switch (columnKey) {
			case "name":
				return (
					<div className='flex items-center gap-3'>
						<AvatarCell src={user.profile_url} alt={user.name} />
						<span>{user.name}</span>
					</div>
				);
			case "role":
				return <RoleBadge role={mapApiRoleToDisplayRole(user.role)} />;
			case "actions":
				return (
					<div className='relative flex items-center gap-2'>
						<Button isIconOnly size='sm' variant='light'>
							<Pencil className='text-default-600' />
						</Button>
						<Button isIconOnly size='sm' variant='light' color='danger'>
							<Trash2 />
						</Button>
					</div>
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
									{renderCell(item, columnKey as keyof UserSummary | "actions")}
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
