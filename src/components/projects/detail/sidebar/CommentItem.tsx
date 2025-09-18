import Image from "next/image";
import { useState } from "react"; // Import useState
import type { CommentDetail } from "@/src/types/comment";
import type { ProjectMember } from "@/src/types/project";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import AttachmentItem from "./AttachmentItem";
import { Button } from "@heroui/react";
import { Trash2, ImageOff } from "lucide-react"; // Import ImageOff

interface CommentItemProps {
	comment: CommentDetail;
	projectMembers: ProjectMember[];
	onDelete: (commentId: number) => void;
	canDelete: boolean;
}

// Helper function to safely format the date
const getTimeAgo = (dateString: string | null | undefined): string => {
	if (!dateString) {
		return "beberapa waktu lalu";
	}
	try {
		const date = new Date(dateString);
		// Check if the date is valid
		if (isNaN(date.getTime())) {
			return "waktu tidak valid";
		}
		return formatDistanceToNow(date, {
			addSuffix: true,
			locale: id,
		});
	} catch (error) {
		console.error("Error formatting date:", dateString, error);
		return "beberapa waktu lalu";
	}
};

export default function CommentItem({
	comment,
	projectMembers,
	onDelete,
	canDelete,
}: CommentItemProps) {
	const [imageError, setImageError] = useState(false); // State untuk melacak error gambar
	const author = projectMembers.find((m) => m.user_id === comment.user_id);
	const authorName = comment.user_name || "Unknown User";

	// Tetap gunakan ui-avatars sebagai upaya terakhir jika profile_url tidak ada
	const authorAvatar =
		comment.profile_url ||
		`https://ui-avatars.com/api/?name=${encodeURIComponent(
			authorName
		)}&background=random&bold=true&size=256`;

	return (
		<div className='flex items-start gap-4 group'>
			{imageError ? (
				// Tampilkan ini jika gambar gagal dimuat
				<div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0'>
					<ImageOff size={20} className='text-gray-500' />
				</div>
			) : (
				// Tampilkan gambar seperti biasa
				<Image
					src={authorAvatar}
					alt={authorName}
					width={40}
					height={40}
					className='rounded-full'
					onError={() => setImageError(true)} // Set state jadi true jika error
				/>
			)}
			<div className='flex-1'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<span className='font-bold'>{authorName}</span>
						<span className='text-xs text-gray-500'>
							{getTimeAgo(comment.created_at)}
						</span>
					</div>
					{canDelete && (
						<Button
							isIconOnly
							size='sm'
							variant='light'
							color='danger'
							className='opacity-0 group-hover:opacity-100 transition-opacity'
							onPress={() => onDelete(comment.id)}>
							<Trash2 size={16} />
						</Button>
					)}
				</div>
				<p className='text-gray-700 mt-1 whitespace-pre-wrap'>{comment.content}</p>
				{comment.attachments && comment.attachments.length > 0 && (
					<div className='mt-2 space-y-2'>
						{comment.attachments.map((att) => (
							<AttachmentItem
								key={att.id}
								attachment={att}
								onDelete={() => {}} // Delete handled elsewhere
								canDelete={false}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
