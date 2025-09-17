"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useClickOutside } from "@/src/hooks/useClickOutside";
import { notificationService } from "@/src/services/notificationService";
import { useAuth } from "@/src/context/AuthContext";
import type { Notification } from "@/src/types/notification";
import { Bell, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

const getNotificationLink = (notif: Notification): string => {
	if (notif.task_id && notif.project_id) {
		return `/projects/${notif.project_id}?tab=daftar`;
	}
	if (notif.project_id) {
		return `/projects/${notif.project_id}`;
	}
	return "#";
};

// Komponen kecil untuk satu item notifikasi
const NotificationItem = ({
	notif,
	onRead,
}: {
	notif: Notification;
	onRead: (id: number) => void;
}) => (
	<li
		className={`border-b border-gray-100 last:border-b-0 ${
			!notif.is_read && "bg-blue-50"
		}`}
		onClick={() => onRead(notif.id)}>
		<Link
			href={getNotificationLink(notif)}
			className='flex items-start gap-4 p-4 hover:bg-gray-50'>
			<Image
				src={
					notif.actor_profile_url || `https://i.pravatar.cc/40?u=${notif.actor_id}`
				}
				alt={notif.actor_name}
				width={40}
				height={40}
				unoptimized={true}
				className='rounded-full'
				onError={(e) =>
					(e.currentTarget.src = "https://placehold.co/40x40/E4E7EC/667085?text=AV")
				}
			/>
			<div className='flex-1'>
				<p
					className='text-sm text-gray-800'
					dangerouslySetInnerHTML={{ __html: notif.message }}
				/>
				<p className='text-xs text-gray-500 mt-1'>
					{formatDistanceToNow(new Date(notif.created_at), {
						addSuffix: true,
						locale: id,
					})}
				</p>
			</div>
		</Link>
	</li>
);

export default function NotificationDropdown() {
	const { token } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useClickOutside(dropdownRef, () => {
		if (isOpen) setIsOpen(false);
	});

	useEffect(() => {
		const handleUpdate = (newNotifications: Notification[]) => {
			setNotifications(newNotifications);
		};

		notificationService.subscribe(handleUpdate);
		return () => notificationService.unsubscribe(handleUpdate);
	}, []);

	const unreadCount = notifications.filter((n) => !n.is_read).length;

	const handleRead = (notificationId: number) => {
		if (token) {
			notificationService.markAsRead(token, notificationId);
		}
	};

	return (
		<div className='relative'>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className='relative p-2 rounded-full hover:bg-gray-100'>
				<Bell className='w-6 h-6 text-gray-600' />
				{unreadCount > 0 && (
					<span className='absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-white'>
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</button>

			{isOpen && (
				<div
					ref={dropdownRef}
					className='absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-lg border border-gray-200 z-40'>
					<div className='p-4 border-b border-gray-200 flex justify-between items-center'>
						<h4 className='text-xl font-bold text-text-main'>Notifikasi</h4>
						<button
							title='close-notifications'
							onClick={() => setIsOpen(false)}
							className='p-1 rounded-full hover:bg-gray-100'>
							<X size={20} className='text-gray-500' />
						</button>
					</div>
					<ul className='max-h-[450px] overflow-y-auto'>
						{notifications.length > 0 ? (
							notifications.map((notif) => (
								<NotificationItem key={notif.id} notif={notif} onRead={handleRead} />
							))
						) : (
							<li className='p-4 text-center text-sm text-gray-500'>
								Tidak ada notifikasi baru.
							</li>
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
