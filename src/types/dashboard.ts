// statistic card
export interface StatCardData {
    title: string;
    value: number;
    change: number;
    changeType: 'increase' | 'decrease';
}

// chart data point
export interface ChartDataPoint {
    month: string;
    masuk: number;
    berjalan: number;
    selesai: number;
}

// data di table
export interface RecentProject {
    id: string;
    name: string;
    taskCount: number;
    dueDate: string;
}
