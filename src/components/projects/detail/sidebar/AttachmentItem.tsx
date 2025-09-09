import type { Attachment } from "@/src/types/attachment";
import { Paperclip, FileText, Trash2 } from "lucide-react";
import { Button } from "@heroui/react";

interface AttachmentItemProps {
	attachment: Attachment;
	onDelete: (attachmentId: number) => void;
	canDelete: boolean;
}

const formatBytes = (bytes: number | string, decimals = 2) => {
	if (typeof bytes === "string") {
		bytes = parseInt(bytes, 10);
	}
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export default function AttachmentItem({
	attachment,
	onDelete,
	canDelete,
}: AttachmentItemProps) {
	return (
		<div className='flex items-center justify-between gap-2 rounded-lg bg-gray-100 p-2 hover:bg-gray-200/70'>
			<div className='flex items-center gap-3'>
				<FileText size={24} className='text-gray-500' />
				<div>
					<a
						href={attachment.file_path}
						target='_blank'
						rel='noopener noreferrer'
						className='font-semibold text-sm hover:underline'>
						{attachment.file_name}
					</a>
					<p className='text-xs text-gray-500'>
						{formatBytes(attachment.file_size)}
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
