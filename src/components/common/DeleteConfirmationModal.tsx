"use client";

import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isLoading: boolean;
	itemName: string;
	itemType?: string;
}

export default function DeleteConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	isLoading,
	itemName,
	itemType = "item",
}: DeleteConfirmationModalProps) {
	return (
		<Modal isOpen={isOpen} onOpenChange={onClose} placement='center'>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className='flex items-center gap-2'>
							<AlertTriangle className='text-[var(--color-secondary)]' />
							Konfirmasi Penghapusan
						</ModalHeader>
						<ModalBody>
							<p>
								Apakah Anda yakin ingin menghapus {itemType}{" "}
								<span className='font-bold'>&quot;{itemName}&quot;</span>? Tindakan ini
								tidak dapat diurungkan.
							</p>
						</ModalBody>
						<ModalFooter>
							<Button variant='light' onPress={onClose}>
								Batal
							</Button>
							<Button
								color='secondary'
								onPress={onConfirm}
								isLoading={isLoading}
								className='bg-[var(--color-secondary)] text-white'>
								Ya, Hapus
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
