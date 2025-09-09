"use client";
import { faker } from "@faker-js/faker/locale/id_ID";
import type { MyTask } from "@/src/types/task";
import { addDays, subDays } from "date-fns";

class MyTaskService {
    public async getMyTasks(): Promise<MyTask[]> {
        // Mensimulasikan penundaan jaringan
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Membuat 15 tugas dummy
        const tasks: MyTask[] = Array.from({ length: 15 }, (_, i) => {
            const statusOptions = ["pending", "in_progress", "completed"] as const;
            const priorityOptions = ["low", "medium", "high"] as const;
            const createdDate = faker.date.recent({ days: 10 });
            const dueDate = faker.helpers.arrayElement([
                subDays(new Date(), 1), // Kemarin
                new Date(), // Hari ini
                addDays(new Date(), 1), // Besok
                faker.date.future({ years: 1 }),
            ]);

            return {
                id: 100 + i,
                name: faker.hacker.phrase().replace(/^./, (c) => c.toUpperCase()),
                projectName: `Proyek ${faker.commerce.department()}`,
                projectId: i + 1,
                description: faker.lorem.sentence(),
                resource_type: "task",
                status: faker.helpers.arrayElement(statusOptions),
                priority: faker.helpers.arrayElement(priorityOptions),
                display_order: i,
                due_date: dueDate.toISOString(),
                start_date: createdDate.toISOString(),
                estimated_duration: faker.number.int({ min: 1, max: 10 }),
                assignees: [], // Anggap saja ini tugas untuk "saya"
            };
        });

        return tasks;
    }
}

export const myTaskService = new MyTaskService();
