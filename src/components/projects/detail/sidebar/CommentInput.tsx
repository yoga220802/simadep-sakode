"use client";

import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { Button, Input, Textarea } from "@heroui/react";
import { Paperclip, Send, UploadCloud } from "lucide-react";
import AttachmentItem from "./AttachmentItem";
import AddAttachmentPopover from "./AddAttachmentPopover";
import { useAppToast } from "@/src/context/ToastContext";
import type { AttachmentLinkCreate } from "@/src/types/attachment";

// Batas dan tipe file yang diizinkan
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FILE_TYPES = [
	"application/pdf",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"image/png",
	"image/jpeg",
];

interface CommentInputProps {
	taskId: number;
	onSubmit: (
		content: string,
		files: File[],
		links: AttachmentLinkCreate[]
	) => Promise<void>;
}

export default function CommentInput({ taskId, onSubmit }: CommentInputProps) {
	const { user } = useAuth();
	const { showToast } = useAppToast();
	const [content, setContent] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [links, setLinks] = useState<AttachmentLinkCreate[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDraggingOver, setIsDraggingOver] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const validateAndAddFiles = useCallback(
		(newFiles: FileList | null) => {
			if (!newFiles) return;
			const validFiles: File[] = [];
			const invalidFiles: { name: string; reason: string }[] = [];

			Array.from(newFiles).forEach((file) => {
				if (file.size > MAX_FILE_SIZE) {
					invalidFiles.push({
						name: file.name,
						reason: "Ukuran terlalu besar (> 5MB)",
					});
				} else if (!ALLOWED_FILE_TYPES.includes(file.type)) {
					invalidFiles.push({
						name: file.name,
						reason: "Tipe file tidak diizinkan",
					});
				} else {
					validFiles.push(file);
				}
			});

			setFiles((prevFiles) => [...prevFiles, ...validFiles]);

			if (invalidFiles.length > 0) {
				const errorMessage = invalidFiles
					.map((f) => `${f.name} (${f.reason})`)
					.join(", ");
				showToast(`Gagal menambahkan: ${errorMessage}`, "error");
			}
		},
		[showToast]
	);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		validateAndAddFiles(event.target.files);
		event.target.value = ""; // Reset input
	};

	const handleRemoveFile = (fileName: string) => {
		setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
	};

	const handleLinkSubmit = (payload: AttachmentLinkCreate) => {
		setLinks((prev) => [...prev, payload]);
		showToast("Link berhasil ditambahkan.", "success");
	};

	const handleRemoveLink = (linkUrl: string) => {
		setLinks((prevLinks) => prevLinks.filter((l) => l.link !== linkUrl));
	};

	const handleSubmit = async () => {
		if (!content.trim() && files.length === 0 && links.length === 0) return;
		setIsSubmitting(true);
		await onSubmit(content, files, links);
		setContent("");
		setFiles([]);
		setLinks([]);
		setIsSubmitting(false);
	};

	// Drag and drop handlers
	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDraggingOver(true);
	};
	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDraggingOver(false);
	};
	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDraggingOver(false);
		validateAndAddFiles(e.dataTransfer.files);
	};

	return (
		<div className='flex items-start gap-4 pt-4 border-t'>
			<div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0'>
				{user?.name.charAt(0).toUpperCase()}
			</div>
			<div
				className={`flex-1 space-y-2 border-2 border-dashed p-3 rounded-lg ${
					isDraggingOver ? "border-primary bg-primary/10" : "border-transparent"
				}`}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}>
				{isDraggingOver && (
					<div className='absolute inset-0 bg-primary/10 flex flex-col items-center justify-center rounded-lg pointer-events-none'>
						<UploadCloud size={48} className='text-primary' />
						<p className='text-primary font-semibold mt-2'>
							Jatuhkan file untuk melampirkan
						</p>
					</div>
				)}
				<Textarea
					placeholder='Tambahkan komentar atau jatuhkan file di sini...'
					value={content}
					onValueChange={setContent}
					minRows={2}
				/>
				{(files.length > 0 || links.length > 0) && (
					<div className='space-y-2'>
						{files.map((file) => (
							<AttachmentItem
								key={file.name}
								attachment={{
									id: 0,
									file_name: file.name,
									file_size: file.size.toString(),
									mime_type: "file",
									file_path: "",
									user_id: 0,
									created_at: "",
									task_id: 0,
									comment_id: null,
								}}
								onDelete={() => handleRemoveFile(file.name)}
								canDelete={true}
							/>
						))}
						{links.map((link) => (
							<AttachmentItem
								key={link.link}
								attachment={{
									id: 0,
									file_name: link.link_name || link.link,
									file_size: "Link",
									mime_type: "link",
									file_path: link.link,
									user_id: 0,
									created_at: "",
									task_id: 0,
									comment_id: null,
								}}
								onDelete={() => handleRemoveLink(link.link)}
								canDelete={true}
							/>
						))}
					</div>
				)}
				<div className='flex justify-between items-center'>
					<AddAttachmentPopover
						onFileUpload={() => fileInputRef.current?.click()}
						onLinkSubmit={handleLinkSubmit}>
						<Button isIconOnly variant='light'>
							<Paperclip size={18} />
						</Button>
					</AddAttachmentPopover>
					<Input
						type='file'
						multiple
						ref={fileInputRef}
						className='hidden'
						onChange={handleFileChange}
						accept={ALLOWED_FILE_TYPES.join(",")}
					/>
					<Button
						color='primary'
						className='bg-primary text-white'
						endContent={<Send size={16} />}
						onPress={handleSubmit}
						isLoading={isSubmitting}
						isDisabled={!content.trim() && files.length === 0 && links.length === 0}>
						Kirim
					</Button>
				</div>
			</div>
		</div>
	);
}
