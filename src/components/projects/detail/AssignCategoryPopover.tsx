"use client";

import { useState, useMemo } from "react";
import type { Category } from "@/src/types/category";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
	Listbox,
	ListboxItem,
	Input,
	Button,
} from "@heroui/react";
import { Search, X } from "lucide-react";

interface AssignCategoryPopoverProps {
	taskId: number;
	categories: Category[];
	selectedCategoryId: number | null;
	onCategoryChange: (taskId: number, categoryId: number | null) => void;
	canEdit: boolean;
	children: React.ReactNode;
}

export default function AssignCategoryPopover({
	taskId,
	categories,
	selectedCategoryId,
	onCategoryChange,
	canEdit,
	children,
}: AssignCategoryPopoverProps) {
	const [search, setSearch] = useState("");

	const filteredCategories = useMemo(() => {
		if (!search) return categories;
		return categories.filter((cat) =>
			cat.name.toLowerCase().includes(search.toLowerCase())
		);
	}, [categories, search]);

	const handleSelection = (categoryId: number | null) => {
		if (selectedCategoryId === categoryId) {
			// Jika kategori yang sama diklik lagi, unassign
			onCategoryChange(taskId, null);
		} else {
			onCategoryChange(taskId, categoryId);
		}
	};

	if (!canEdit) {
		const category = categories.find((c) => c.id === selectedCategoryId);
		return <>{category?.name || "-"}</>;
	}

	return (
		<Popover placement='bottom-start'>
			<PopoverTrigger>{children}</PopoverTrigger>
			<PopoverContent className='p-2'>
				<div className='w-72'>
					<div className='px-2 py-1.5'>
						<Input
							label='Cari Kategori'
							size='sm'
							startContent={<Search size={16} />}
							value={search}
							onValueChange={setSearch}
						/>
					</div>
					<Listbox
						aria-label='Tetapkan kategori'
						className='max-h-60 overflow-y-auto mt-2'>
						{filteredCategories.map((category) => (
							<ListboxItem
								key={category.id}
								onPress={() => handleSelection(category.id)}
								className={selectedCategoryId === category.id ? "bg-primary/20" : ""}>
								{category.name}
							</ListboxItem>
						))}
					</Listbox>
					{selectedCategoryId && (
						<div className='p-2 mt-2 border-t'>
							<Button
								size='sm'
								variant='light'
								color='danger'
								fullWidth
								onPress={() => handleSelection(null)}>
								Hapus Kategori
							</Button>
						</div>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
