"use client";

import { faker } from "@faker-js/faker/locale/id_ID";
import type {
    AssigneePerformance,
    PriorityDistribution,
    WeeklyActivity,
    TaskEstimation,
    ProjectReportData,
} from "@/src/types/report";
import type { ProjectMember } from "@/src/types/project";
import { subDays, format } from "date-fns";

// --- DUMMY DATA GENERATOR ---
class ReportService {
    public getDummyReportData(members: ProjectMember[]): ProjectReportData {
        // 1. Performa Penerima Tugas
        const assigneePerformance: AssigneePerformance[] = members.map(
            (member, index) => {
                // FIX: Pastikan assignee pertama punya tugas selesai dan belum selesai
                if (index === 0 && members.length > 0) {
                    return {
                        assignee: {
                            user_id: member.user_id,
                            name: member.name,
                            avatarUrl:
                                member.avatarUrl ||
                                `https://i.pravatar.cc/40?u=${member.user_id}`,
                        },
                        selesai: faker.number.int({ min: 1, max: 5 }), // Pasti punya tugas selesai
                        inProgress: faker.number.int({ min: 1, max: 3 }), // Pasti punya tugas belum selesai
                    };
                }
                // Untuk member lain, bisa 0 atau lebih
                const selesai = faker.number.int({ min: 0, max: 8 });
                const inProgress = faker.number.int({ min: 0, max: 5 });
                return {
                    assignee: {
                        user_id: member.user_id,
                        name: member.name,
                        avatarUrl:
                            member.avatarUrl ||
                            `https://i.pravatar.cc/40?u=${member.user_id}`,
                    },
                    selesai,
                    inProgress,
                };
            }
        );

        // 2. Distribusi Prioritas
        const priorityDistribution: PriorityDistribution[] = [
            { name: "Rendah", value: faker.number.int({ min: 1, max: 10 }) },
            { name: "Sedang", value: faker.number.int({ min: 1, max: 15 }) },
            { name: "Tinggi", value: faker.number.int({ min: 1, max: 5 }) },
        ];

        // 3. Aktivitas Mingguan
        const weeklyActivity: WeeklyActivity[] = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(new Date(), 6 - i);
            const total = faker.number.int({ min: 5, max: 20 });
            const selesai = faker.number.int({ min: 1, max: total });
            return {
                date: format(date, "dd/MM"),
                total,
                selesai,
            };
        });

        // 4. Perbandingan Estimasi
        const taskEstimation: TaskEstimation[] = [
            "Requirement",
            "UI/UX Desain",
            "Reviewer",
            "Pemodelan",
            "Usecase Diagram",
            "Activity Diagram",
        ].map((name) => {
            const estimasi = faker.number.int({ min: 5, max: 25 });
            return {
                name,
                estimasi,
                selesai: faker.number.int({ min: 4, max: estimasi }),
            };
        });

        const totalSelesai = assigneePerformance.reduce(
            (acc, curr) => acc + curr.selesai,
            0
        );
        const totalInProgress = assigneePerformance.reduce(
            (acc, curr) => acc + curr.inProgress,
            0
        );

        return {
            summary: {
                tasksCompleted: totalSelesai,
                tasksInProgress: totalInProgress,
                totalTasks: totalSelesai + totalInProgress,
            },
            assigneePerformance,
            priorityDistribution,
            weeklyActivity,
            taskEstimation,
        };
    }
}

export const reportService = new ReportService();

