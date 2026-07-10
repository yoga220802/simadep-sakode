"use client";

import { useRef, useSyncExternalStore } from "react"; // Import useSyncExternalStore
import Link from "next/link";
import Image from "next/image";
import { useClickOutside } from "@/src/hooks/useClickOutside";
import { notificationService } from "@/src/services/notificationService";
import { useAuth } from "@/src/context/AuthContext";
import type { Notification } from "@/src/types/notification";
import { Bell, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Button, useDisclosure } from "@heroui/react";

const getNotificationLink = (notif: Notification): string => {
	if (notif.task_id && notif.project_id) {
		return `/projects/${notif.project_id}?task=${notif.task_id}`;
	}
	if (notif.project_id) {
		return `/projects/${notif.project_id}`;
	}
	return "#";
};

const NotificationItem = ({ notif }: { notif: Notification }) => (
	<li
		className={`border-b border-gray-100 last:border-b-0 ${
			!notif.is_read && "bg-blue-50"
		}`}>
		<Link
			href={getNotificationLink(notif)}
			className='flex items-start gap-4 p-4 hover:bg-gray-50'>
			<Image
				src={
					notif.actor_profile_url || `https://i.pravatar.cc/40?u=${notif.actor_id}`
				}
				alt={notif.actor_name || "SIMADEP"}
				width={40}
				height={40}
				unoptimized={true}
				className='rounded-full'
				onError={(e) =>
					(e.currentTarget.src = "https://placehold.co/40x40/E4E7EC/667085?text=AV")
				}
			/>
			<div className='flex-1'>
				<p className='text-sm font-semibold text-gray-900'>{notif.title}</p>
				<p className='text-sm text-gray-700'>{notif.message}</p>
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
	const { isOpen, onOpen, onClose } = useDisclosure();
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Ambil state notifikasi dari service
	const notificationState = useSyncExternalStore(
		notificationService.subscribe,
		notificationService.getSnapshot,
		notificationService.getServerState
	);

	// Buka "bungkus" state object untuk mendapatkan array notifikasi
	const notifications = notificationState.notifications;

	useClickOutside(dropdownRef, () => {
		if (isOpen) {
			onClose();
		}
	});

	const unreadCount = notificationState.unreadCount;

	const handleMarkAllRead = () => {
		if (token) {
			notificationService.markAllAsRead();
		}
	};

	return (
		<div className='relative'>
			<Button
				isIconOnly
				variant='light'
				onPress={onOpen}
				className='relative p-2 rounded-full hover:bg-gray-100'>
				<Bell className='w-6 h-6 text-gray-600' />
				{unreadCount > 0 && (
					<span className='absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold ring-2 ring-white'>
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}
			</Button>

			{isOpen && (
				<div
					ref={dropdownRef}
					className='absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-lg border border-gray-200 z-40'>
					<div className='p-4 border-b border-gray-200 flex justify-between items-center'>
						<h4 className='text-xl font-bold text-text-main'>Notifikasi</h4>
						<div className='flex items-center gap-2'>
							{unreadCount > 0 && (
								<Button
									size='sm'
									variant='light'
									startContent={<Check size={16} />}
									onPress={handleMarkAllRead}>
									Tandai semua dibaca
								</Button>
							)}
							<Button
								isIconOnly
								variant='light'
								size='sm'
								onPress={onClose}
								aria-label='Tutup notifikasi'>
								<X size={20} className='text-gray-500' />
							</Button>
						</div>
					</div>
					<ul className='max-h-[450px] overflow-y-auto'>
						{notifications.length > 0 ? (
							notifications.map((notif) => (
								<NotificationItem key={notif.id} notif={notif} />
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
