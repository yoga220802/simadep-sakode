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
import type { Project, ProjectFormData } from "@/src/types/project";
import {
	parseAbsoluteToLocal,
	getLocalTimeZone,
	type DateValue, // FIX: Import tipe DateValue
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
	// FIX: Ganti 'any' dengan tipe yang lebih spesifik
	const [startDate, setStartDate] = useState<DateValue | null>(
		project.start_date ? parseAbsoluteToLocal(project.start_date) : null
	);
	const [endDate, setEndDate] = useState<DateValue | null>(
		project.end_date ? parseAbsoluteToLocal(project.end_date) : null
	);

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setStartDate(
			project.start_date ? parseAbsoluteToLocal(project.start_date) : null
		);
		setEndDate(project.end_date ? parseAbsoluteToLocal(project.end_date) : null);
	}, [project]);

	const handleSubmit = async () => {
		if (!token) return;

		setIsLoading(true);
		setError(null);

		try {
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
			size='xl'
			placement='center'
			backdrop='blur'>
			<ModalContent className='bg-white'>
				{(onClose) => (
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
							{error && (
								<p className='text-sm text-red-500 text-center mt-4'>{error}</p>
							)}
						</ModalBody>
						<ModalFooter>
							<Button color='danger' variant='light' onPress={onClose}>
								Batal
							</Button>
							<Button
								color='primary'
								onPress={handleSubmit}
								isLoading={isLoading}
								className='bg-[var(color-primary)] text-white font-bold'>
								{isLoading ? "Menyimpan..." : "Simpan Jadwal"}
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
