"use client";

import type { Client } from "@/src/types/adminDashboard";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
} from "@heroui/react";

// Komponen Badge untuk Role Client
const RoleBadge = ({ role }: { role: Client["role"] }) => (
	<span className='inline-flex items-center justify-center rounded-full border px-4 py-1 text-sm font-semibold bg-red-100 border-red-500 text-red-600'>
		{role}
	</span>
);

export default function ClientTable({ clients }: { clients: Client[] }) {
	return (
		<div className='rounded-xl border-2 border-[#E4E7EC] bg-white'>
			<div className='px-6 py-5'>
				<h3 className='font-palanquin text-4xl font-bold text-[#3B4852]'>Client</h3>
			</div>
			<Table
				aria-label='Tabel Client'
				classNames={{
					wrapper: "p-0 shadow-none rounded-none",
					thead: "bg-[#F2F4F7]",
					th: "px-6 py-4 text-left text-sm font-bold text-[#3B4852] uppercase tracking-wider border-b-2 border-[#E4E7EC]",
					tbody: "bg-white divide-y divide-[#E4E7EC]",
					tr: "hover:bg-gray-50",
					td: "px-6 py-4 whitespace-nowrap text-base text-[#667085]",
				}}>
				<TableHeader>
					<TableColumn>NO</TableColumn>
					<TableColumn>NAMA</TableColumn>
					<TableColumn>EMAIL</TableColumn>
					<TableColumn>PROYEK</TableColumn>
					<TableColumn>ROLE</TableColumn>
				</TableHeader>
				<TableBody>
					{clients.map((client, index) => (
						<TableRow key={client.id}>
							<TableCell className='font-semibold'>{index + 1}</TableCell>
							<TableCell className='font-semibold text-gray-800'>
								{client.name}
							</TableCell>
							<TableCell>{client.email}</TableCell>
							<TableCell>{client.projects.join(", ")}</TableCell>
							<TableCell>
								<RoleBadge role={client.role} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
