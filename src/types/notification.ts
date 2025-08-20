interface NotificationUser {
    name: string;
    avatarUrl: string;
}

export interface Notification {
    id: string;
    user: NotificationUser;
    action: string; // e.g., "menyelesaikan tugas"
    target: string; // e.g., "Database Proyek"
    project: string; // e.g., "Proyek Pertama"
    timestamp: string; 
    read: boolean;
    link?: string; 
}
