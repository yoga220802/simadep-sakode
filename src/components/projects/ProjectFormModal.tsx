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
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	DatePicker,
} from "@heroui/react";
import { projectService } from "@/src/services/projectService";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext"; // Import toast hook
import type {
	Project,
	ProjectFormData,
	ProjectStatus,
} from "@/src/types/project";
import {
	parseAbsoluteToLocal,
	getLocalTimeZone,
	type DateValue,
} from "@internationalized/date";
import { ChevronDown } from "lucide-react";
import type { Selection } from "@react-types/shared";

interface ProjectFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	// Callback baru yang mengembalikan data proyek
	onSaveSuccess: (project: Project, isNew: boolean) => void;
	projectToEdit?: Project | null;
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
	onSaveSuccess,
	projectToEdit,
}: ProjectFormModalProps) {
	const { token } = useAuth();
	const { showToast } = useAppToast(); // Gunakan toast
	const isEditMode = !!projectToEdit;

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startDate, setStartDate] = useState<DateValue | null>(null);
	const [endDate, setEndDate] = useState<DateValue | null>(null);
	const [status, setStatus] = useState<ProjectStatus>("tender");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (isOpen) {
			if (isEditMode && projectToEdit) {
				setTitle(projectToEdit.title);
				setDescription(projectToEdit.description || "");
				setStatus(projectToEdit.status);
				setStartDate(
					projectToEdit.start_date
						? parseAbsoluteToLocal(projectToEdit.start_date)
						: null
				);
				setEndDate(
					projectToEdit.end_date
						? parseAbsoluteToLocal(projectToEdit.end_date)
						: null
				);
			} else {
				setTitle("");
				setDescription("");
				setStatus("tender");
				setStartDate(null);
				setEndDate(null);
			}
			setError(null);
		}
	}, [isOpen, projectToEdit, isEditMode]);

	const handleSubmit = async () => {
		if (!token || !title) {
			setError("Nama proyek tidak boleh kosong.");
			return;
		}

		setIsLoading(true);
		setError(null);

		const projectData: ProjectFormData = {
			title,
			description: description || undefined,
			start_date: startDate
				? startDate.toDate(getLocalTimeZone()).toISOString()
				: undefined,
			end_date: endDate
				? endDate.toDate(getLocalTimeZone()).toISOString()
				: undefined,
			status,
		};

		const actionPromise = isEditMode
			? projectService.updateProject(
					token,
					projectToEdit!.id.toString(),
					projectData
			  )
			: projectService.createProject(token, projectData);

		showToast(actionPromise, {
			loading: isEditMode
				? `Menyimpan perubahan untuk "${title}"...`
				: `Membuat proyek baru "${title}"...`,
			// FIX: Terima `result` sebagai `unknown` lalu cast ke `Project`
			success: (result: unknown) => {
				const savedProject = result as Project;
				onSaveSuccess(savedProject, !isEditMode);
				return `Proyek "${savedProject.title}" berhasil disimpan.`;
			},
			error: (err: Error) => `Gagal menyimpan proyek: ${err.message}`,
		});

		try {
			await actionPromise;
		} catch (err) {
			// Error is handled by the toast
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
							{isEditMode ? "Edit Proyek" : "Tambah Proyek Baru"}
						</ModalHeader>
						<ModalBody>
							<div className='space-y-6'>
								<Input
									isRequired
									label='Nama Proyek'
									variant='bordered'
									value={title}
									onValueChange={setTitle}
								/>
								<Textarea
									label='Deskripsi'
									variant='bordered'
									value={description}
									onValueChange={setDescription}
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
								<Dropdown>
									<DropdownTrigger>
										<Button variant='bordered' className='w-full justify-between'>
											{statusOptions.find((opt) => opt.value === status)?.label}
											<ChevronDown />
										</Button>
									</DropdownTrigger>
									<DropdownMenu
										aria-label='Pilih Status Proyek'
										disallowEmptySelection
										selectionMode='single'
										selectedKeys={[status]}
										onSelectionChange={(keys: Selection) =>
											setStatus(Array.from(keys)[0] as ProjectStatus)
										}>
										{statusOptions.map((opt) => (
											<DropdownItem key={opt.value}>{opt.label}</DropdownItem>
										))}
									</DropdownMenu>
								</Dropdown>
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
								{isEditMode ? "Simpan Perubahan" : "Buat Proyek"}
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
