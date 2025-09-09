"use client";

import { useState, useEffect } from "react";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	Input,
	Textarea,
} from "@heroui/react";
import { categoryService } from "@/src/services/categoryService";
import { useAuth } from "@/src/context/AuthContext";
import type { Category } from "@/src/types/category";

interface CategoryFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: () => void;
	category: Category | null;
	projectId: number;
}

export default function CategoryFormModal({
	isOpen,
	onClose,
	onSave,
	category,
	projectId,
}: CategoryFormModalProps) {
	const { token } = useAuth();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isEditMode = !!category;

	useEffect(() => {
		if (isOpen) {
			setName(category?.name || "");
			setDescription(category?.description || "");
			setError(null);
		}
	}, [isOpen, category]);

	const handleSubmit = async () => {
		if (!token || !name.trim()) {
			setError("Nama kategori tidak boleh kosong.");
			return;
		}
		setIsLoading(true);
		setError(null);

		try {
			if (isEditMode && category) {
				await categoryService.updateCategory(token, category.id, {
					name,
					description,
				});
			} else {
				await categoryService.createCategory(token, projectId, {
					name,
					description,
				});
			}
			onSave();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={onClose} placement='center'>
			<ModalContent>
				{(onCloseHandler) => (
					<>
						<ModalHeader>
							{isEditMode ? "Edit Kategori" : "Tambah Kategori Baru"}
						</ModalHeader>
						<ModalBody>
							<div className='space-y-4'>
								<Input
									isRequired
									label='Nama Kategori'
									value={name}
									onValueChange={setName}
								/>
								<Textarea
									label='Deskripsi'
									value={description}
									onValueChange={setDescription}
								/>
								{error && <p className='text-sm text-red-500'>{error}</p>}
							</div>
						</ModalBody>
						<ModalFooter>
							<Button variant='light' onPress={onCloseHandler}>
								Batal
							</Button>
							<Button
								color='primary'
								onPress={handleSubmit}
								isLoading={isLoading}
								className='bg-[var(--color-primary)] text-white font-bold'>
								Simpan
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
