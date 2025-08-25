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
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	DatePicker,
} from "@heroui/react";
import { projectService } from "@/src/services/projectService";
import { useAuth } from "@/src/context/AuthContext";
import type { ProjectFormData, ProjectStatus } from "@/src/types/project";
import { today, getLocalTimeZone } from "@internationalized/date";
import { ChevronDown } from "lucide-react";

interface ProjectFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onProjectCreated: () => void;
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
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startDate, setStartDate] = useState<any>(today(getLocalTimeZone()));
	const [endDate, setEndDate] = useState<any>(null);
	const [status, setStatus] = useState<ProjectStatus>("tender");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (!token || !title) {
			setError("Nama proyek tidak boleh kosong.");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
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

			await projectService.createProject(token, projectData);
			onProjectCreated();
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
							Tambah Proyek Baru
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

								<div>
									<label className='text-sm text-gray-600 mb-2 block'>
										Status Proyek
									</label>
									<Dropdown>
										<DropdownTrigger>
											<Button variant='bordered' className='w-full justify-between h-14'>
												{statusOptions.find((opt) => opt.value === status)?.label}
												<ChevronDown />
											</Button>
										</DropdownTrigger>
										<DropdownMenu
											aria-label='Pilih Status Proyek'
											disallowEmptySelection
											selectionMode='single'
											selectedKeys={[status]}
											onSelectionChange={(keys) =>
												setStatus(Array.from(keys)[0] as ProjectStatus)
											}
											disabledKeys={["cancel"]}>
											{statusOptions.map((opt) => (
												<DropdownItem key={opt.value}>{opt.label}</DropdownItem>
											))}
										</DropdownMenu>
									</Dropdown>
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
								Buat Proyek
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
