"use client";

import { useState } from "react";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
	Listbox,
	ListboxItem,
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	Input,
	useDisclosure,
} from "@heroui/react";
import { Paperclip, Link, UploadCloud } from "lucide-react";
import type { AttachmentLinkCreate } from "@/src/types/attachment";

interface AddAttachmentPopoverProps {
	onFileUpload: () => void;
	onLinkSubmit: (payload: AttachmentLinkCreate) => void;
	children: React.ReactNode;
}

export default function AddAttachmentPopover({
	onFileUpload,
	onLinkSubmit,
	children,
}: AddAttachmentPopoverProps) {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const [link, setLink] = useState("");
	const [linkName, setLinkName] = useState("");

	const handleSubmitLink = () => {
		if (link) {
			onLinkSubmit({ link, link_name: linkName || undefined });
			onOpenChange(); // Close modal
			setLink(""); // Reset form
			setLinkName("");
		}
	};

	return (
		<>
			<Popover placement='top'>
				<PopoverTrigger>{children}</PopoverTrigger>
				<PopoverContent>
					<Listbox
						aria-label='Attachment options'
						onAction={(key) => {
							if (key === "file") onFileUpload();
							if (key === "link") onOpen();
						}}>
						<ListboxItem key='file' startContent={<UploadCloud size={16} />}>
							Unggah File
						</ListboxItem>
						<ListboxItem key='link' startContent={<Link size={16} />}>
							Lampirkan Link
						</ListboxItem>
					</Listbox>
				</PopoverContent>
			</Popover>

			<Modal isOpen={isOpen} onOpenChange={onOpenChange}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader>Lampirkan Link</ModalHeader>
							<ModalBody>
								<Input
									isRequired
									label='URL'
									placeholder='https://example.com'
									value={link}
									onValueChange={setLink}
								/>
								<Input
									label='Nama Tampilan (Opsional)'
									placeholder='Contoh: Dokumen Desain'
									value={linkName}
									onValueChange={setLinkName}
								/>
							</ModalBody>
							<ModalFooter>
								<Button variant='light' onPress={onClose}>
									Batal
								</Button>
								<Button
									color='primary'
									className='bg-primary text-white'
									onPress={handleSubmitLink}>
									Simpan
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
