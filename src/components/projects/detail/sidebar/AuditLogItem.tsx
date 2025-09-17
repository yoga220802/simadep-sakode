"use client";

import type {
	TaskAuditSchema,
	TaskActionType,
	TaskStatusChangeAuditSchema,
} from "@/src/types/comment";
import type { StatusTask } from "@/src/types/task"; // Import tipe StatusTask
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
	History,
	ArrowRightLeft,
	Pencil,
	UserPlus,
	UserMinus,
	type LucideIcon,
} from "lucide-react";

interface AuditLogItemProps {
	audit: TaskAuditSchema;
}

// Helper function untuk format tanggal yang aman
const getTimeAgo = (dateString: string | null | undefined): string => {
	if (!dateString) return "beberapa waktu lalu";
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return "waktu tidak valid";
		return formatDistanceToNow(date, { addSuffix: true, locale: id });
	} catch (error) {
		console.error("Error formatting date:", dateString, error);
		return "beberapa waktu lalu";
	}
};

// Map action types to specific icons
const auditIconConfig: Record<TaskActionType, LucideIcon> = {
	"task.status.changed": ArrowRightLeft,
	"task.title.changed": Pencil,
	"task.assigned.added": UserPlus,
	"task.assigned.removed": UserMinus,
};

// Map status types to specific colors for status change logs
const statusColorConfig: Record<StatusTask, string> = {
	pending: "text-gray-600 bg-gray-100",
	in_progress: "text-blue-600 bg-blue-100",
	completed: "text-green-600 bg-green-100",
	cancelled: "text-red-600 bg-red-100",
};

// Map other action types to their colors
const actionColorConfig: Record<
	Exclude<TaskActionType, "task.status.changed">,
	string
> = {
	"task.title.changed": "text-purple-600 bg-purple-100",
	"task.assigned.added": "text-green-600 bg-green-100",
	"task.assigned.removed": "text-red-600 bg-red-100",
};

export default function AuditLogItem({ audit }: AuditLogItemProps) {
	const IconComponent = auditIconConfig[audit.action_type] || History;

	// Fungsi untuk menentukan warna ikon secara dinamis
	const getIconColor = () => {
		if (audit.action_type === "task.status.changed") {
			// Pastikan details ada dan sesuai
			const details = audit.details as TaskStatusChangeAuditSchema;
			return (
				statusColorConfig[details.new_status as StatusTask] ||
				"text-gray-500 bg-gray-100"
			);
		}
		// Fallback untuk tipe aksi lainnya
		return (
			actionColorConfig[audit.action_type as keyof typeof actionColorConfig] ||
			"text-gray-500 bg-gray-100"
		);
	};

	const iconColorClass = getIconColor();

	return (
		<div className='flex items-center gap-3 pl-2'>
			{/* Ikon dinamis berdasarkan tipe aksi dan status baru */}
			<div
				className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${iconColorClass}`}>
				<IconComponent size={14} />
			</div>

			{/* Konten log dengan font lebih kecil dan layout inline */}
			<div className='flex-1'>
				<p className='text-xs text-gray-600'>
					<span className='font-semibold'>{audit.user_name || "Sistem"}</span>{" "}
					<span dangerouslySetInnerHTML={{ __html: audit.content }} />
					<span className='text-gray-400 ml-2'>{getTimeAgo(audit.created_at)}</span>
				</p>
			</div>
		</div>
	);
}
