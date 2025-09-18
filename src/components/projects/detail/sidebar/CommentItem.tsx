import Image from "next/image";
import { useState } from "react";
import type { CommentDetail } from "@/src/types/comment";
import type { ProjectMember } from "@/src/types/project";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import AttachmentItem from "./AttachmentItem";
import { Button } from "@heroui/react";
import { Trash2, ImageOff } from "lucide-react";

interface CommentItemProps {
	comment: CommentDetail;
	projectMembers: ProjectMember[];
	onDelete: (commentId: number) => void;
	canDelete: boolean;
}

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

export default function CommentItem({
	comment,
	projectMembers,
	onDelete,
	canDelete,
}: CommentItemProps) {
	const [imageError, setImageError] = useState(false);
	// Cari info member dari list, tapi prioritaskan user_name dari data comment
	const authorName = comment.user_name || "Unknown User";

	const authorAvatar = (() => {
		// Jika ada profile_url, BUKAN dari ui-avatars, dan tidak error, gunakan itu.
		if (
			comment.profile_url &&
			!comment.profile_url.includes("ui-avatars.com") &&
			!imageError
		) {
			return comment.profile_url;
		}

		// SELALU bangun ulang URL ui-avatars dari user_name untuk menghindari double encoding.
		const nameForAvatar = authorName.includes("@")
			? authorName.split("@")[0]
			: authorName;

		const url = new URL("https://ui-avatars.com/api/");
		url.searchParams.set("name", nameForAvatar);
		url.searchParams.set("background", "random");
		url.searchParams.set("bold", "true");
		url.searchParams.set("size", "256");
		return url.toString();
	})();

	return (
		<div className='flex items-start gap-4 group'>
			{imageError ? (
				<div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0'>
					<ImageOff size={20} className='text-gray-500' />
				</div>
			) : (
				<Image
					src={authorAvatar}
					alt={authorName}
					width={40}
					height={40}
					className='rounded-full'
					onError={() => setImageError(true)}
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
								onDelete={() => {}}
								canDelete={false}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
