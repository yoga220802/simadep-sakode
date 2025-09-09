"use client";

import { useState, useEffect } from "react";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	DatePicker,
} from "@heroui/react";
import { projectService } from "@/src/services/projectService";
import { useAuth } from "@/src/context/AuthContext";
import { useAppToast } from "@/src/context/ToastContext"; // Import toast hook
import type { Project, ProjectFormData } from "@/src/types/project";
import {
	parseAbsoluteToLocal,
	getLocalTimeZone,
	type DateValue,
} from "@internationalized/date";

interface EditScheduleModalProps {
	isOpen: boolean;
	onClose: () => void;
	project: Project;
	onProjectUpdate: () => void;
}

export default function EditScheduleModal({
	isOpen,
	onClose,
	project,
	onProjectUpdate,
}: EditScheduleModalProps) {
	const { token } = useAuth();
	const { showToast } = useAppToast(); // Gunakan toast
	const [startDate, setStartDate] = useState<DateValue | null>(null);
	const [endDate, setEndDate] = useState<DateValue | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setStartDate(
				project.start_date ? parseAbsoluteToLocal(project.start_date) : null
			);
			setEndDate(project.end_date ? parseAbsoluteToLocal(project.end_date) : null);
		}
	}, [isOpen, project]);

	const handleSubmit = async () => {
		if (!token) return;

		setIsLoading(true);

		const projectData: ProjectFormData = {
			title: project.title,
			description: project.description || undefined,
			status: project.status,
			start_date: startDate
				? startDate.toDate(getLocalTimeZone()).toISOString()
				: undefined,
			end_date: endDate
				? endDate.toDate(getLocalTimeZone()).toISOString()
				: undefined,
		};

		const updatePromise = projectService.updateProject(
			token,
			project.id.toString(),
			projectData
		);

		showToast(updatePromise, {
			loading:  "Menyimpan jadwal proyek...",
			success: () => {
				onProjectUpdate();
				onClose();
				return ("Jadwal proyek berhasil diperbarui.");
			},
			error: (err: Error) => `Gagal memperbarui jadwal: ${err.message}`,
		});

		try {
			await updatePromise;
		} catch (error) {
			// Error is handled by toast
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={onClose}
			size='xl'
			placement='center'
			backdrop='blur'>
			<ModalContent className='bg-white'>
				{(onCloseHandler) => (
					<>
						<ModalHeader className='flex flex-col gap-1'>
							Edit Jadwal Proyek
						</ModalHeader>
						<ModalBody>
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
						</ModalBody>
						<ModalFooter>
							<Button color='danger' variant='light' onPress={onCloseHandler}>
								Batal
							</Button>
							<Button
								color='primary'
								onPress={handleSubmit}
								isLoading={isLoading}
								className='bg-[var(--color-primary)] text-white font-bold'>
								{isLoading ? "Menyimpan..." : "Simpan Jadwal"}
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
