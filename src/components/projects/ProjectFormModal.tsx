"use client";

import { useState } from "react";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	Input,
	Textarea,
	Select,
	SelectItem,
} from "@heroui/react";
import { projectService } from "@/src/services/projectService";
import { useAuth } from "@/src/context/AuthContext";
import type { ProjectFormData, ProjectStatus } from "@/src/types/project";

interface ProjectFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onProjectCreated: () => void; // Callback untuk refresh daftar proyek
}

const statusOptions: { value: ProjectStatus; label: string }[] = [
	{ value: "tender", label: "Tender" },
	{ value: "active", label: "Aktif" },
	{ value: "completed", label: "Selesai" },
	{ value: "cancel", label: "Batal" },
];

export default function ProjectFormModal({
	isOpen,
	onClose,
	onProjectCreated,
}: ProjectFormModalProps) {
	const { token } = useAuth();
	const [formData, setFormData] = useState<ProjectFormData>({
		title: "",
		description: "",
		start_date: "",
		end_date: "",
		status: "tender",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	// Handler khusus untuk komponen Select
	const handleStatusChange = (keys: any) => {
		// HeroUI/NextUI onSelectionChange bisa mengembalikan Set
		const status = Array.from(keys)[0] as ProjectStatus;
		setFormData((prev) => ({ ...prev, status }));
	};

	const handleSubmit = async () => {
		if (!token || !formData.title) {
			setError("Nama proyek tidak boleh kosong.");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Konversi tanggal ke format ISO jika ada nilainya
			const dataToSend: ProjectFormData = {
				...formData,
				start_date: formData.start_date
					? new Date(formData.start_date).toISOString()
					: undefined,
				end_date: formData.end_date
					? new Date(formData.end_date).toISOString()
					: undefined,
				description: formData.description || undefined,
			};

			await projectService.createProject(token, dataToSend);
			onProjectCreated(); // Panggil callback
			onClose(); // Tutup modal
		} catch (err) {
			setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={onClose} size='2xl'>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className='flex flex-col gap-1'>
							Tambah Proyek Baru
						</ModalHeader>
						<ModalBody>
							<div className='space-y-4'>
								<Input
									isRequired
									label='Nama Proyek'
									name='title'
									value={formData.title}
									onChange={handleChange}
									placeholder='Masukkan nama proyek'
								/>
								<Textarea
									label='Deskripsi'
									name='description'
									value={formData.description}
									onChange={handleChange}
									placeholder='Masukkan deskripsi singkat proyek (opsional)'
								/>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<Input
										type='date'
										label='Tanggal Mulai'
										name='start_date'
										value={formData.start_date}
										onChange={handleChange}
										placeholder='Pilih tanggal mulai'
									/>
									<Input
										type='date'
										label='Tanggal Selesai'
										name='end_date'
										value={formData.end_date}
										onChange={handleChange}
										placeholder='Pilih tanggal selesai'
									/>
								</div>
								<Select
									isRequired
									label='Status Proyek'
									name='status'
									selectedKeys={[formData.status]}
									onSelectionChange={handleStatusChange}>
									{statusOptions.map((status) => (
										<SelectItem key={status.value}>{status.label}</SelectItem>
									))}
								</Select>
								{error && <p className='text-sm text-red-500 text-center'>{error}</p>}
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='danger' variant='light' onPress={onClose}>
								Batal
							</Button>
							<Button color='primary' onPress={handleSubmit} isLoading={isLoading}>
								Buat Proyek
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
