"use client";

import Image from "next/image";
import type { Employee } from "@/src/types/adminDashboard";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
} from "@heroui/react";

// Komponen Badge untuk Role
const RoleBadge = ({ role }: { role: Employee["role"] }) => {
	const baseClasses =
		"inline-flex items-center justify-center rounded-full border px-4 py-1 text-sm font-semibold";
	// Menambahkan styling untuk role Admin
	const styles = {
		Admin: "bg-orange-100 border-orange-500 text-orange-600",
		"Product Manager": "bg-blue-100 border-blue-500 text-blue-600",
		Member: "bg-green-100 border-green-500 text-green-600",
	};
	return <span className={`${baseClasses} ${styles[role]}`}>{role}</span>;
};

export default function EmployeeTable({
	employees,
}: {
	employees: Employee[];
}) {
	return (
		<div className='rounded-xl border-2 border-[#E4E7EC] bg-white'>
			<div className='px-6 py-5'>
				<h3 className='font-palanquin text-4xl font-bold text-[#3B4852]'>
					Pegawai
				</h3>
			</div>
			{/* --- FIX: Menambahkan div wrapper dengan overflow-x-auto --- */}
			<div className='overflow-x-auto'>
				<Table
					aria-label='Tabel Pegawai'
					classNames={{
						wrapper: "p-0 shadow-none rounded-none",
						thead: "bg-[#F2F4F7]",
						th: "px-6 py-4 text-left text-sm font-bold text-[#3B4852] uppercase tracking-wider border-b-2 border-[#E4E7EC] whitespace-nowrap",
						tbody: "bg-white divide-y divide-[#E4E7EC]",
						tr: "hover:bg-gray-50",
						td: "px-6 py-4 whitespace-nowrap text-base text-[#667085]",
					}}>
					<TableHeader>
						<TableColumn>NO</TableColumn>
						<TableColumn>FOTO</TableColumn>
						<TableColumn>NAMA</TableColumn>
						<TableColumn>JABATAN</TableColumn>
						<TableColumn>EMAIL</TableColumn>
						<TableColumn>ROLE</TableColumn>
					</TableHeader>
					<TableBody>
						{employees.map((employee, index) => (
							<TableRow key={employee.id}>
								<TableCell className='font-semibold'>{index + 1}</TableCell>
								<TableCell>
									<Image
										src={employee.avatarUrl}
										alt={employee.name}
										width={40}
										height={40}
										className='rounded-full'
									/>
								</TableCell>
								<TableCell className='font-semibold text-gray-800'>
									{employee.name}
								</TableCell>
								<TableCell>{employee.position}</TableCell>
								<TableCell>{employee.email}</TableCell>
								<TableCell>
									<RoleBadge role={employee.role} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
