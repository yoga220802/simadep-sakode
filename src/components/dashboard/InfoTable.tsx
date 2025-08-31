"use client";

import Image from "next/image";
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
} from "@heroui/react";
import type { ReactNode } from "react";

// Tipe untuk konfigurasi kolom
export interface ColumnConfig<T> {
	key: keyof T | "index";
	header: string;
	render?: (item: T, index: number) => ReactNode;
}

interface InfoTableProps<T extends { id: string }> {
	title: string;
	items: T[];
	columns: ColumnConfig<T>[];
}

export default function InfoTable<T extends { id: string }>({
	title,
	items,
	columns,
}: InfoTableProps<T>) {
	return (
		<div className='rounded-xl border-2 border-[#E4E7EC] bg-white'>
			<div className='px-6 py-5'>
				<h3 className='font-palanquin text-2xl font-bold text-[#3B4852]'>
					{title}
				</h3>
			</div>
			<div className='overflow-x-auto'>
				<Table
					aria-label={`Tabel ${title}`}
					classNames={{
						wrapper: "p-0 shadow-none rounded-none",
						thead: "bg-[#F2F4F7]",
						th: "px-6 py-4 text-left text-sm font-bold text-[#3B4852] uppercase tracking-wider border-b-2 border-[#E4E7EC] whitespace-nowrap",
						tbody: "bg-white divide-y divide-[#E4E7EC]",
						tr: "hover:bg-gray-50",
						td: "px-6 py-4 whitespace-nowrap text-base text-[#667085]",
					}}>
					<TableHeader>
						{columns.map((col) => (
							<TableColumn key={String(col.key)}>{col.header}</TableColumn>
						))}
					</TableHeader>
					<TableBody>
						{items.map((item, index) => (
							<TableRow key={item.id}>
								{columns.map((col) => (
									<TableCell key={`${item.id}-${String(col.key)}`}>
										{col.render
											? col.render(item, index)
											: col.key === "index"
											? index + 1
											: (item[col.key as keyof T] as ReactNode)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}

// --- Komponen-komponen kecil untuk rendering sel ---
export const RoleBadge = ({
	role,
}: {
	role: "Admin" | "Project Manager" | "Team Member" | "Viewer";
}) => {
	// FIX: Menambahkan lebar minimum agar semua badge sama ukurannya
	const baseClasses =
		"inline-flex items-center justify-center rounded-full border px-4 py-1 text-sm font-semibold w-[140px]"; // Menambahkan w-[140px]

	const styles = {
		Admin: "bg-orange-100 border-orange-500 text-orange-600",
		"Project Manager": "bg-blue-100 border-blue-500 text-blue-600",
		"Team Member": "bg-green-100 border-green-500 text-green-600",
		Viewer: "bg-gray-100 border-gray-500 text-gray-600",
	};
	return <span className={`${baseClasses} ${styles[role]}`}>{role}</span>;
};

// FIX: Membuat PriorityBadge lebih fleksibel
export const PriorityBadge = ({ priority }: { priority: string }) => {
	const lowerCasePriority = priority.toLowerCase();
	const baseClasses =
		"inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold";
	let styles = "bg-gray-100 border-gray-500 text-gray-600"; // Default style

	if (lowerCasePriority === "tinggi" || lowerCasePriority === "high") {
		styles = "bg-red-100 border-red-500 text-red-600";
	} else if (lowerCasePriority === "sedang" || lowerCasePriority === "medium") {
		styles = "bg-yellow-100 border-yellow-500 text-yellow-600";
	} else if (lowerCasePriority === "rendah" || lowerCasePriority === "low") {
		styles = "bg-green-100 border-green-500 text-green-600";
	}

	return <span className={`${baseClasses} ${styles}`}>{priority}</span>;
};

export const AvatarCell = ({ src, alt }: { src: string; alt: string }) => (
	<Image
		src={src}
		alt={alt}
		width={40}
		height={40}
		unoptimized={true}
		className='rounded-full'
		onError={(e) =>
			(e.currentTarget.src = `https://placehold.co/40x40/E4E7EC/667085?text=${alt
				.charAt(0)
				.toUpperCase()}`)
		}
	/>
);
