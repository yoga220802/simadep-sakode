import type {
    CommentCreatePayload,
    CommentDetail,
    TimelineItem,
} from "@/src/types/comment";
import { API_BASE_URL } from "../config/api";

class CommentService {
    private readonly baseUrl: string | undefined;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    private getHeaders(token: string) {
        return {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
        };
    }

    public async getComments(
        token: string,
        taskId: number,
        include_audits = false
    ): Promise<TimelineItem[]> {
        const params = new URLSearchParams({
            include_audits: String(include_audits),
        });
        const response = await fetch(
            `${this.baseUrl}/v1/tasks/${taskId}/comments?${params.toString()}`,
            {
                method: "GET",
                headers: this.getHeaders(token),
            }
        );
        if (!response.ok) {
            throw new Error("Gagal mengambil komentar.");
        }
        return response.json();
    }

    public async createComment(
        token: string,
        payload: CommentCreatePayload
    ): Promise<CommentDetail> {
        const response = await fetch(`${this.baseUrl}/v1/comments`, {
            method: "POST",
            headers: this.getHeaders(token),
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal membuat komentar baru.");
        }
        return response.json();
    }

    public async deleteComment(
        token: string,
        taskId: number,
        commentId: number
    ): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/v1/tasks/${taskId}/comments/${commentId}`,
            {
                method: "DELETE",
                headers: this.getHeaders(token),
            }
        );
        if (response.status !== 204) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal menghapus komentar.");
        }
    }
}

export const commentService = new CommentService();

