"use client";

import { Button, useDisclosure } from "@heroui/react";
import { Plus } from "lucide-react";
import ProjectFormModal from "./ProjectFormModal";

interface CreateProjectProps {
	onProjectCreated: () => void;
}

export default function CreateProject({
	onProjectCreated,
}: CreateProjectProps) {
	const { isOpen, onOpen, onClose } = useDisclosure();

	const handleOpenModal = () => {
		console.log("Tombol 'Buat Proyek' diklik, modal di-trigger.");
		onOpen();
	};

	return (
		<>
			<Button
				onPress={handleOpenModal}
				className='bg-[var(--color-primary)] text-white font-bold'
				startContent={<Plus />}>
				Buat Proyek
			</Button>

			<ProjectFormModal
				isOpen={isOpen}
				onClose={onClose}
				onProjectCreated={onProjectCreated}
			/>
		</>
	);
}
