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
	parseAbsoluteToLocal,
	type DateValue,
} from "@internationalized/date";
import type {
	Task,
	PriorityLevel,
	TaskUpdatePayload,
	TaskCreatePayload,
	MilestoneCreatePayload,
} from "@/src/types/task";
import type { Selection } from "@react-types/shared";

interface TaskFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (
		data: TaskUpdatePayload | TaskCreatePayload | MilestoneCreatePayload
	) => Promise<void>;
	task?: Task | null;
	mode: "createMilestone" | "createTask" | "createSubtask" | "editTask";
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
	mode,
}: TaskFormModalProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [priority, setPriority] = useState<PriorityLevel>("low");
	const [dueDate, setDueDate] = useState<DateValue | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const isEditMode = mode === "editTask";

	useEffect(() => {
		if (isOpen) {
			if (isEditMode && task) {
				setName(task.name);
				setDescription(task.description || "");
				setPriority(task.priority || "low");
				setDueDate(task.due_date ? parseAbsoluteToLocal(task.due_date) : null);
			} else {
				// Reset form for create modes
				setName("");
				setDescription("");
				setPriority("low");
				setDueDate(null);
			}
			setError(null);
		}
	}, [isOpen, task, isEditMode]);

	const handleSubmit = async () => {
		if (!name.trim()) {
			setError("Nama tidak boleh kosong.");
			return;
		}
		setIsLoading(true);
		setError(null);

		let payload: TaskUpdatePayload | TaskCreatePayload | MilestoneCreatePayload;

		if (mode === "createMilestone") {
			payload = { title: name };
		} else {
			payload = {
				name,
				description: description || undefined,
				priority,
				due_date: dueDate
					? dueDate.toDate(getLocalTimeZone()).toISOString()
					: undefined,
			};
		}

		try {
			await onSave(payload);
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
		} finally {
			setIsLoading(false);
		}
	};

	const getModalTitle = () => {
		switch (mode) {
			case "createMilestone":
				return "Buat Milestone Baru";
			case "createTask":
				return "Buat Tugas Baru";
			case "createSubtask":
				return "Buat Subtugas Baru";
			case "editTask":
				return "Edit Tugas";
		}
	};

	return (
		<Modal isOpen={isOpen} onOpenChange={onClose} size='2xl' placement='center'>
			<ModalContent>
				{(onCloseHandler) => (
					<>
						<ModalHeader>{getModalTitle()}</ModalHeader>
						<ModalBody>
							<div className='space-y-4'>
								<Input
									isRequired
									label={mode === "createMilestone" ? "Nama Milestone" : "Nama Tugas"}
									value={name}
									onValueChange={setName}
								/>
								{mode !== "createMilestone" && (
									<>
										<Textarea
											label='Deskripsi'
											value={description}
											onValueChange={setDescription}
										/>
										<DatePicker
											label='Tenggat Waktu'
											value={dueDate}
											onChange={setDueDate}
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
									</>
								)}
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
								{isEditMode ? "Simpan Perubahan" : "Buat"}
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
