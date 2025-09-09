import Image from "next/image";
import type { Comment } from "@/src/types/comment";
import type { ProjectMember } from "@/src/types/project";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import AttachmentItem from "./AttachmentItem";
import { Button } from "@heroui/react";
import { Trash2 } from "lucide-react";

interface CommentItemProps {
	comment: Comment;
	projectMembers: ProjectMember[];
	onDelete: (commentId: number) => void;
	canDelete: boolean;
}

export default function CommentItem({
	comment,
	projectMembers,
	onDelete,
	canDelete,
}: CommentItemProps) {
	const author = projectMembers.find((m) => m.user_id === comment.user_id);
	const authorName = author?.name || "Unknown User";
	const authorAvatar =
		author?.profile_url || `https://i.pravatar.cc/40?u=${comment.user_id}`;

	return (
		<div className='flex items-start gap-4 group'>
			<Image
				src={authorAvatar}
				alt={authorName}
				width={40}
				height={40}
				className='rounded-full'
			/>
			<div className='flex-1'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<span className='font-bold'>{authorName}</span>
						<span className='text-xs text-gray-500'>
							{formatDistanceToNow(new Date(comment.created_at), {
								addSuffix: true,
								locale: id,
							})}
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
								canDelete={false} // Deletion handled at task level
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
