import { useState, useRef } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { Button, Textarea } from "@heroui/react";
import { Paperclip, Send } from "lucide-react";
import AttachmentItem from "./AttachmentItem";

interface CommentInputProps {
	taskId: number;
	onSubmit: (content: string, files: File[]) => Promise<void>;
}

export default function CommentInput({ taskId, onSubmit }: CommentInputProps) {
	const { user } = useAuth();
	const [content, setContent] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			setFiles((prevFiles) => [...prevFiles, ...Array.from(event.target.files!)]);
		}
	};

	const handleRemoveFile = (fileName: string) => {
		setFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
	};

	const handleSubmit = async () => {
		if (!content.trim() && files.length === 0) return;
		setIsSubmitting(true);
		await onSubmit(content, files);
		setContent("");
		setFiles([]);
		setIsSubmitting(false);
	};

	return (
		<div className='flex items-start gap-4 pt-4 border-t'>
			<div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary flex-shrink-0'>
				{user?.name.charAt(0).toUpperCase()}
			</div>
			<div className='flex-1 space-y-2'>
				<Textarea
					placeholder='Tambahkan komentar...'
					value={content}
					onValueChange={setContent}
					minRows={2}
				/>
				{files.length > 0 && (
					<div className='space-y-2'>
						{files.map((file) => (
							<AttachmentItem
								key={file.name}
								attachment={{
									id: 0,
									file_name: file.name,
									file_size: file.size.toString(),
									// dummy data
									task_id: taskId,
									comment_id: null,
									mime_type: file.type,
									file_path: "",
									user_id: 0,
									created_at: "",
								}}
								onDelete={() => handleRemoveFile(file.name)}
								canDelete={true}
							/>
						))}
					</div>
				)}
				<div className='flex justify-between items-center'>
					<Button
						isIconOnly
						variant='light'
						onPress={() => fileInputRef.current?.click()}>
						<Paperclip size={18} />
					</Button>
					<input
						type='file'
						multiple
						ref={fileInputRef}
						className='hidden'
						onChange={handleFileChange}
						title='Attach files'
					/>
					<Button
						color='primary'
						className='bg-primary text-white'
						endContent={<Send size={16} />}
						onPress={handleSubmit}
						isLoading={isSubmitting}
						isDisabled={!content.trim() && files.length === 0}>
						Kirim
					</Button>
				</div>
			</div>
		</div>
	);
}
