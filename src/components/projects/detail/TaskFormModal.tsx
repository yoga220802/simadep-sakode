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
import { ChevronDown } from "lucide-react";
import {
	getLocalTimeZone,
	today,
	parseAbsoluteToLocal,
	CalendarDate,
} from "@internationalized/date";
import type {
	Task,
	PriorityLevel,
	TaskUpdatePayload,
	TaskCreatePayload,
} from "@/src/types/task";

interface TaskFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (data: TaskUpdatePayload | TaskCreatePayload) => Promise<void>;
	task?: Task | null;
	isSubtask?: boolean;
}

const priorityOptions: { value: PriorityLevel; label: string }[] = [
	{ value: "low", label: "Rendah" },
	{ value: "medium", label: "Sedang" },
	{ value: "high", label: "Tinggi" },
];

export default function TaskFormModal({
	isOpen,
	onClose,
	onSave,
	task,
	isSubtask = false,
}: TaskFormModalProps) {
	const [name, setName] = useState("");
	const [priority, setPriority] = useState<PriorityLevel>("low");
	const [dueDate, setDueDate] = useState<CalendarDate | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isEditMode = !!task;

	useEffect(() => {
		if (isOpen && task) {
			setName(task.name);
			setPriority(task.priority || "low");
			if (task.due_date) {
				const zonedDateTime = parseAbsoluteToLocal(task.due_date);
				setDueDate(
					new CalendarDate(
						zonedDateTime.year,
						zonedDateTime.month,
						zonedDateTime.day
					)
				);
			} else {
				setDueDate(null);
			}
		} else if (isOpen && !task) {
			setName("");
			setPriority("low");
			setDueDate(null);
		}
	}, [isOpen, task]);

	const handleSubmit = async () => {
		if (!name.trim()) {
			setError("Nama tugas tidak boleh kosong.");
			return;
		}
		setIsLoading(true);
		setError(null);

		const payload: TaskUpdatePayload | TaskCreatePayload = {
			name,
			priority,
			due_date: dueDate
				? dueDate.toDate(getLocalTimeZone()).toISOString()
				: undefined,
		};

		try {
			await onSave(payload);
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={onClose} size='2xl' placement='center'>
			<ModalContent>
				{(onCloseHandler) => (
					<>
						<ModalHeader>
							{isEditMode
								? "Edit Tugas"
								: `Buat ${isSubtask ? "Subtugas" : "Tugas"} Baru`}
						</ModalHeader>
						<ModalBody>
							<div className='space-y-4'>
								<Input
									isRequired
									label='Nama Tugas'
									value={name}
									onValueChange={setName}
								/>
								<DatePicker
									label='Tenggat Waktu'
									value={dueDate}
									onChange={(date) => setDueDate(date as CalendarDate)}
								/>
								<Dropdown>
									<DropdownTrigger>
										<Button variant='bordered' className='w-full justify-between'>
											{priorityOptions.find((p) => p.value === priority)?.label}
											<ChevronDown />
										</Button>
									</DropdownTrigger>
									<DropdownMenu
										aria-label='Pilih Prioritas'
										selectionMode='single'
										selectedKeys={[priority]}
										onSelectionChange={(keys) =>
											setPriority(Array.from(keys)[0] as PriorityLevel)
										}>
										{priorityOptions.map((opt) => (
											<DropdownItem key={opt.value}>{opt.label}</DropdownItem>
										))}
									</DropdownMenu>
								</Dropdown>
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
								{isEditMode ? "Simpan Perubahan" : "Buat Tugas"}
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
