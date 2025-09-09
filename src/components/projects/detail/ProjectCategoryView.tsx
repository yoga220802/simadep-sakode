"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { categoryService } from "@/src/services/categoryService";
import type { Category } from "@/src/types/category";
import {
	Button,
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Tooltip,
} from "@heroui/react";
import { Plus, Pencil, Trash2, LoaderCircle } from "lucide-react";
import DeleteConfirmationModal from "../../common/DeleteConfirmationModal";
import CategoryFormModal from "./CategoryFormModal";

export default function ProjectCategoryView() {
	const { token } = useAuth();
	const params = useParams();
	const projectId = Number(params.id);

	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// State for modals
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(
		null
	);

	const fetchCategories = useCallback(async () => {
		if (!token) return;
		setIsLoading(true);
		try {
			const data = await categoryService.getCategories(token, projectId);
			setCategories(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Gagal memuat kategori.");
		} finally {
			setIsLoading(false);
		}
	}, [token, projectId]);

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	const handleOpenCreateModal = () => {
		setSelectedCategory(null);
		setIsFormModalOpen(true);
	};

	const handleOpenEditModal = (category: Category) => {
		setSelectedCategory(category);
		setIsFormModalOpen(true);
	};

	const handleOpenDeleteModal = (category: Category) => {
		setSelectedCategory(category);
		setIsDeleteModalOpen(true);
	};

	const handleCloseModals = () => {
		setIsFormModalOpen(false);
		setIsDeleteModalOpen(false);
		setSelectedCategory(null);
	};

	if (isLoading) {
		return (
			<div className='flex justify-center items-center h-64'>
				<LoaderCircle className='w-12 h-12 animate-spin text-primary' />
			</div>
		);
	}

	if (error) {
		return <div className='text-center text-red-500 py-10'>{error}</div>;
	}

	return (
		<>
			<div className='p-8 bg-white rounded-lg border-2 border-gray-200'>
				<div className='flex justify-between items-center mb-6'>
					<h2 className='text-2xl font-bold'>Manajemen Kategori Tugas</h2>
					<Button
						color='primary'
						className='bg-[var(--color-primary)] text-white'
						startContent={<Plus size={18} />}
						onPress={handleOpenCreateModal}>
						Tambah Kategori
					</Button>
				</div>
				<Table aria-label='Tabel Kategori'>
					<TableHeader>
						<TableColumn>NAMA KATEGORI</TableColumn>
						<TableColumn>DESKRIPSI</TableColumn>
						<TableColumn>AKSI</TableColumn>
					</TableHeader>
					<TableBody
						items={categories}
						emptyContent={"Belum ada kategori untuk proyek ini."}>
						{(item) => (
							<TableRow key={item.id}>
								<TableCell className='font-semibold'>{item.name}</TableCell>
								<TableCell>{item.description || "-"}</TableCell>
								<TableCell>
									<div className='relative flex items-center gap-2'>
										<Tooltip content='Edit'>
											<Button
												isIconOnly
												size='sm'
												variant='light'
												onPress={() => handleOpenEditModal(item)}>
												<Pencil className='text-default-400' />
											</Button>
										</Tooltip>
										<Tooltip color='danger' content='Hapus'>
											<Button
												isIconOnly
												size='sm'
												variant='light'
												color='danger'
												onPress={() => handleOpenDeleteModal(item)}>
												<Trash2 />
											</Button>
										</Tooltip>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<CategoryFormModal
				isOpen={isFormModalOpen}
				onClose={handleCloseModals}
				onSave={() => {
					fetchCategories();
					handleCloseModals();
				}}
				category={selectedCategory}
				projectId={projectId}
			/>

			{selectedCategory && (
				<DeleteConfirmationModal
					isOpen={isDeleteModalOpen}
					onClose={handleCloseModals}
					onConfirm={async () => {
						if (token && selectedCategory) {
							await categoryService.deleteCategory(
								token,
								projectId,
								selectedCategory.id
							);
							fetchCategories();
							handleCloseModals();
						}
					}}
					isLoading={false}
					itemName={selectedCategory.name}
					itemType='kategori'
				/>
			)}
		</>
	);
}
