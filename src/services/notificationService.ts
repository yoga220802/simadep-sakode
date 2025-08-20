import type { Notification } from "@/src/types/notification";

type NotificationListener = (notifications: Notification[]) => void;


class NotificationService {
    private notifications: Notification[] = [
        {
            id: '1',
            user: { name: 'Ahmad Nur Sahid', avatarUrl: 'https://i.pravatar.cc/40?img=1' },
            action: 'menyelesaikan tugas',
            target: 'Database Proyek',
            project: 'Proyek Pertama',
            timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
            read: false,
            link: '/projects/1/tasks/123'
        },
        {
            id: '2',
            user: { name: 'Yoga Agustiansyah', avatarUrl: 'https://i.pravatar.cc/40?img=2' },
            action: 'menyelesaikan tugas',
            target: 'Dashboard Proyek',
            project: 'Proyek Pertama',
            timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
            read: false,
            link: '/projects/1/tasks/124'
        },
        {
            id: '3',
            user: { name: 'Dhika Restu Fauzi', avatarUrl: 'https://i.pravatar.cc/40?img=3' },
            action: 'menyelesaikan tugas',
            target: 'UI/UX Design Proyek',
            project: 'Proyek Pertama',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            read: true,
            link: '/projects/1/tasks/125'
        },
        {
            id: '4',
            user: { name: 'Lea Siti Saumi', avatarUrl: 'https://i.pravatar.cc/40?img=4' },
            action: 'menyelesaikan tugas',
            target: 'Pemodelan Proyek',
            project: 'Proyek Pertama',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            read: true,
            link: '/projects/1/tasks/126'
        },
    ];
    private listeners: NotificationListener[] = [];

    public subscribe(listener: NotificationListener): void {
        this.listeners.push(listener);
        listener([...this.notifications]);
    }

    public unsubscribe(listener: NotificationListener): void {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    private _notify(): void {
        this.listeners.forEach(listener => listener([...this.notifications]));
    }

    public markAllAsRead(): void {
        this.notifications.forEach(n => n.read = true);
        this._notify();
    }
}

export const notificationService = new NotificationService();
