"use client";

import {
	Button,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Popover,
	PopoverTrigger,
	PopoverContent,
	DatePicker,
} from "@heroui/react";
import {
	ChevronDown,
	Circle,
	CheckCircle2,
	XCircle,
	MinusCircle,
} from "lucide-react";
import type { StatusTask, PriorityLevel } from "@/src/types/task";
import type { ProjectRole } from "@/src/types/project";
import {
	parseAbsoluteToLocal,
	getLocalTimeZone,
	type DateValue,
} from "@internationalized/date";
import { useState } from "react";

// --- Komponen untuk Status Badge & Dropdown ---

const statusConfig: Record<
	StatusTask,
	{ label: string; icon: React.ReactNode; color: string }
> = {
	pending: {
		label: "Pending",
		icon: <Circle size={16} />,
		color: "text-gray-500 bg-gray-100",
	},
	in_progress: {
		label: "In Progress",
		icon: <MinusCircle size={16} />,
		color: "text-blue-600 bg-blue-100",
	},
	completed: {
		label: "Completed",
		icon: <CheckCircle2 size={16} />,
		color: "text-green-600 bg-green-100",
	},
	cancelled: {
		label: "Cancelled",
		icon: <XCircle size={16} />,
		color: "text-red-600 bg-red-100",
	},
};

export const StatusDisplay = ({
	status,
	userProjectRole,
	onChange,
}: {
	status: StatusTask;
	userProjectRole: ProjectRole;
	onChange: (newStatus: StatusTask) => void;
}) => {
	const config = statusConfig[status] || statusConfig.pending;
	const canEdit =
		userProjectRole === "owner" || userProjectRole === "contributor";

	const availableStatus: StatusTask[] =
		userProjectRole === "owner"
			? ["pending", "in_progress", "completed", "cancelled"]
			: ["pending", "in_progress", "completed"];

	if (!canEdit) {
		return (
			<div
				className={`flex items-center gap-2 text-sm font-medium py-1 px-3 rounded-full w-full ${config.color}`}>
				{config.icon}
				<span>{config.label}</span>
			</div>
		);
	}

	return (
		<Dropdown>
			<DropdownTrigger>
				<Button
					size='sm'
					variant='light'
					className={`flex items-center gap-2 text-sm font-medium py-1 px-3 rounded-full w-full ${config.color}`}>
					{config.icon}
					<span>{config.label}</span>
					<ChevronDown size={14} />
				</Button>
			</DropdownTrigger>
			<DropdownMenu
				aria-label='Ubah Status'
				selectionMode='single'
				selectedKeys={[status]}
				onAction={(key) => onChange(key as StatusTask)}>
				{availableStatus.map((statusKey) => (
					<DropdownItem key={statusKey} startContent={statusConfig[statusKey].icon}>
						{statusConfig[statusKey].label}
					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	);
};

// --- Komponen untuk Editable Date ---

export const EditableDate = ({
	date,
	canEdit,
	onSave,
}: {
	date: string | null;
	canEdit: boolean;
	onSave: (newDate: string | null) => void;
}) => {
	const [newDate, setNewDate] = useState<DateValue | null>(
		date ? parseAbsoluteToLocal(date) : null
	);

	const handleSave = (selectedDate: DateValue) => {
		const isoString = selectedDate.toDate(getLocalTimeZone()).toISOString();
		onSave(isoString);
	};

	const dateText = date
		? new Date(date).toLocaleDateString("id-ID", {
				day: "2-digit",
				month: "short",
				year: "numeric",
		  })
		: "-";

	if (!canEdit) {
		return <span className='text-sm text-gray-600'>{dateText}</span>;
	}

	return (
		<Popover placement='bottom'>
			<PopoverTrigger>
				<Button size='sm' variant='light' className='-ml-3 text-sm'>
					{dateText}
				</Button>
			</PopoverTrigger>
			<PopoverContent>
				<DatePicker
					aria-label='Pilih tanggal'
					value={newDate}
					onChange={(d) => {
						setNewDate(d);
						if (d) {
							handleSave(d);
						}
					}}
				/>
			</PopoverContent>
		</Popover>
	);
};
