"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext";
import { categoryService } from "@/src/services/categoryService";
import type { Category } from "@/src/types/category";
import type { Project, ProjectRole } from "@/src/types/project";
import type { User } from "@/src/types/auth";
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

interface ProjectCategoryViewProps {
	project: Project;
	user: User | null;
	userProjectRole: ProjectRole;
}

export default function ProjectCategoryView({
	project,
	user,
	userProjectRole,
}: ProjectCategoryViewProps) {
	const { token } = useAuth();
	const { showToast } = useAppToast();
	const projectId = project.id;

	const [categories, setCategories] = useState<Category[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// State for modals
	const [isFormModalOpen, setIsFormModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(
		null
	);

	const canEdit = userProjectRole === "owner";

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

	const handleDeleteConfirm = async () => {
		if (!token || !selectedCategory) return;

		setIsDeleting(true);

		const deletePromise = categoryService.deleteCategory(
			token,
			projectId,
			selectedCategory.id
		);

		showToast(deletePromise, {
			loading: `Menghapus kategori "${selectedCategory.name}"...`,
			success: () => {
				fetchCategories();
				handleCloseModals();
				return `Kategori "${selectedCategory.name}" berhasil dihapus.`;
			},
			error: (err: Error) => `Gagal menghapus kategori: ${err.message}`,
		});

		try {
			await deletePromise;
		} catch (err) {
			// handled by toast
		} finally {
			setIsDeleting(false);
		}
	};

	// Definisikan kolom secara dinamis berdasarkan hak akses
	const columns = useMemo(() => {
		const baseColumns = [
			{ key: "name", label: "NAMA KATEGORI" },
			{ key: "description", label: "DESKRIPSI" },
		];
		if (canEdit) {
			baseColumns.push({ key: "actions", label: "AKSI" });
		}
		return baseColumns;
	}, [canEdit]);

	// Fungsi untuk me-render sel secara dinamis
	const renderCell = useCallback(
		(item: Category, columnKey: React.Key) => {
			const cellValue = item[columnKey as keyof Category];

			switch (columnKey) {
				case "name":
					return <span className='font-semibold'>{cellValue}</span>;
				case "description":
					return cellValue || "-";
				case "actions":
					return (
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
					);
				default:
					return cellValue;
			}
		},
		[handleOpenEditModal, handleOpenDeleteModal]
	);

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
					{canEdit && (
						<Button
							color='primary'
							className='bg-[var(--color-primary)] text-white'
							startContent={<Plus size={18} />}
							onPress={handleOpenCreateModal}>
							Tambah Kategori
						</Button>
					)}
				</div>
				<Table aria-label='Tabel Kategori'>
					<TableHeader columns={columns}>
						{(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
					</TableHeader>
					<TableBody
						items={categories}
						emptyContent={"Belum ada kategori untuk proyek ini."}>
						{(item) => (
							<TableRow key={item.id}>
								{(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{canEdit && (
				<>
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
							onConfirm={handleDeleteConfirm}
							isLoading={isDeleting}
							itemName={selectedCategory.name}
							itemType='kategori'
						/>
					)}
				</>
			)}
		</>
	);
}
