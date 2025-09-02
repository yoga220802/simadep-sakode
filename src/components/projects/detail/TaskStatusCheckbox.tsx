"use client";

import type { ProjectRole } from "@/src/types/project";
import type { StatusTask } from "@/src/types/task";
import { Check, X, Minus } from "lucide-react";

interface TaskStatusCheckboxProps {
	status: StatusTask | null;
	userProjectRole: ProjectRole;
	onChange: (newStatus: StatusTask) => void;
}

export default function TaskStatusCheckbox({
	status,
	userProjectRole,
	onChange,
}: TaskStatusCheckboxProps) {
	const getStatusInfo = (): { icon: React.ReactNode; color: string } => {
		switch (status) {
			case "completed":
				return { icon: <Check size={16} />, color: "text-green-500" };
			case "in_progress":
				return { icon: <Minus size={16} />, color: "text-blue-500" };
			case "cancelled":
				return { icon: <X size={16} />, color: "text-red-500" };
			case "pending":
			default:
				return { icon: <Minus size={16} />, color: "text-gray-400" };
		}
	};

	const { icon, color } = getStatusInfo();

	const availableStatus: StatusTask[] =
		userProjectRole === "owner"
			? ["pending", "in_progress", "completed", "cancelled"]
			: ["pending", "in_progress", "completed"];

	const cycleStatus = () => {
		const currentIndex = availableStatus.indexOf(status || "pending");
		const nextIndex = (currentIndex + 1) % availableStatus.length;
		onChange(availableStatus[nextIndex]);
	};

	return (
		<button
			onClick={cycleStatus}
			className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
				status === "completed" ? "border-green-500" : "border-gray-300"
			} ${color}`}
			title={`Status: ${status || "pending"}. Klik untuk mengubah.`}>
			{icon}
		</button>
	);
}
