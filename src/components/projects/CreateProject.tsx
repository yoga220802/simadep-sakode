"use client";

import { Button } from "@heroui/react";
import { Plus } from "lucide-react";

interface CreateProjectProps {
	onOpenCreateModal: () => void;
}

export default function CreateProject({
	onOpenCreateModal,
}: CreateProjectProps) {
	return (
		<Button
			onPress={onOpenCreateModal}
			className='bg-[var(--color-primary)] text-white font-bold'
			startContent={<Plus />}>
			Buat Proyek
		</Button>
	);
}
