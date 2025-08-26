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
	DatePicker,
} from "@heroui/react";
import { projectService } from "@/src/services/projectService";
import { useAuth } from "@/src/context/AuthContext";
import type { Project, ProjectFormData } from "@/src/types/project";
import {
	parseAbsoluteToLocal,
	getLocalTimeZone,
} from "@internationalized/date"; // FIX: Mengganti parseISO dengan parseAbsoluteToLocal
import { LoaderCircle } from "lucide-react";

interface EditProjectModalProps {
	isOpen: boolean;
	onClose: () => void;
	project: Project;
	onProjectUpdate: () => void;
}

export default function EditProjectModal({
	isOpen,
	onClose,
	project,
	onProjectUpdate,
}: EditProjectModalProps) {
	const { token } = useAuth();
	const [title, setTitle] = useState(project.title);
	const [description, setDescription] = useState(project.description || "");
	// FIX: Menggunakan parseAbsoluteToLocal untuk mengubah string ISO ke objek tanggal yang kompatibel
	const [startDate, setStartDate] = useState<any>(
		project.start_date ? parseAbsoluteToLocal(project.start_date) : null
	);
	const [endDate, setEndDate] = useState<any>(
		project.end_date ? parseAbsoluteToLocal(project.end_date) : null
	);

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Update state jika props project berubah
	useEffect(() => {
		setTitle(project.title);
		setDescription(project.description || "");
		setStartDate(
			project.start_date ? parseAbsoluteToLocal(project.start_date) : null
		);
		setEndDate(project.end_date ? parseAbsoluteToLocal(project.end_date) : null);
	}, [project]);

	const handleSubmit = async () => {
		if (!token || !title) {
			setError("Nama proyek tidak boleh kosong.");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// API menggunakan PUT, jadi kita harus kirim semua data
			const projectData: ProjectFormData = {
				title,
				description: description,
				start_date: startDate
					? startDate.toDate(getLocalTimeZone()).toISOString()
					: undefined,
				end_date: endDate
					? endDate.toDate(getLocalTimeZone()).toISOString()
					: undefined,
				status: project.status, // Status tidak diubah di modal ini
			};

			await projectService.updateProject(
				token,
				project.id.toString(),
				projectData
			);
			onProjectUpdate();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={onClose}
			size='2xl'
			placement='center'
			backdrop='blur'>
			<ModalContent className='bg-white'>
				{(onClose) => (
					<>
						<ModalHeader className='flex flex-col gap-1'>
							Edit Detail Proyek
						</ModalHeader>
						<ModalBody>
							<div className='space-y-6'>
								<Input
									isRequired
									label='Nama Proyek'
									variant='bordered'
									value={title}
									onValueChange={setTitle}
									classNames={{ inputWrapper: "h-14" }}
								/>
								<Textarea
									label='Deskripsi'
									variant='bordered'
									value={description}
									onValueChange={setDescription}
									classNames={{ inputWrapper: "min-h-24" }}
								/>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
									<DatePicker
										label='Tanggal Mulai'
										variant='bordered'
										value={startDate}
										onChange={setStartDate}
									/>
									<DatePicker
										label='Tanggal Selesai'
										variant='bordered'
										value={endDate}
										onChange={setEndDate}
									/>
								</div>
								{error && <p className='text-sm text-red-500 text-center'>{error}</p>}
							</div>
						</ModalBody>
						<ModalFooter>
							<Button color='danger' variant='light' onPress={onClose}>
								Batal
							</Button>
							<Button
								color='primary'
								onPress={handleSubmit}
								isLoading={isLoading}
								className='bg-[var(--color-primary)] text-white font-bold'>
								{isLoading ? "Menyimpan..." : "Simpan Perubahan"}
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
