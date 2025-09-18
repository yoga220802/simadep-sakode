"use client";

import type { Attachment } from "@/src/types/attachment";
import { FileText, Link as LinkIcon, Trash2 } from "lucide-react";
import { Button } from "@heroui/react";

interface AttachmentItemProps {
	attachment: Attachment;
	onDelete: (attachmentId: number) => void;
	canDelete: boolean;
}

const formatBytes = (bytes: number | string, decimals = 2) => {
	if (typeof bytes === "string") {
		const parsedBytes = parseInt(bytes, 10);
		if (isNaN(parsedBytes)) return bytes;
		bytes = parsedBytes;
	}
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

// Fungsi helper untuk memastikan URL memiliki protokol
const ensureHttp = (url: string) => {
	if (!url) return "#";
	if (url.startsWith("http://") || url.startsWith("https://")) {
		return url;
	}
	return `https://${url}`;
};

export default function AttachmentItem({
	attachment,
	onDelete,
	canDelete,
}: AttachmentItemProps) {
	const isLink = attachment.mime_type.toLowerCase().includes("link");
	const safeUrl = isLink
		? ensureHttp(attachment.file_path)
		: attachment.file_path;

	return (
		<div className='flex items-center justify-between gap-2 rounded-lg bg-gray-100 p-2 hover:bg-gray-200/70'>
			<div className='flex items-center gap-3 min-w-0'>
				{isLink ? (
					<LinkIcon size={24} className='text-gray-500 flex-shrink-0' />
				) : (
					<FileText size={24} className='text-gray-500 flex-shrink-0' />
				)}
				<div className='min-w-0'>
					<a
						href={safeUrl}
						target='_blank'
						rel='noopener noreferrer'
						className='font-semibold text-sm hover:underline truncate block'>
						{attachment.file_name}
					</a>
					<p className='text-xs text-gray-500'>
						{isLink ? "Tautan eksternal" : formatBytes(attachment.file_size)}
					</p>
				</div>
			</div>
			{canDelete && (
				<Button
					isIconOnly
					size='sm'
					variant='light'
					color='danger'
					onPress={() => onDelete(attachment.id)}>
					<Trash2 size={16} />
				</Button>
			)}
		</div>
	);
}
