import { Attachment, AttachmentLinkCreate } from "../types/attachment";

class AttachmentService {
    private readonly baseUrl: string | undefined;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_API_SMIP_BASE_URL;
    }

    private getAuthHeader(token: string, contentType?: string) {
        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
        };
        if (contentType) {
            headers["Content-Type"] = contentType;
        }
        return headers;
    }

    public async uploadForTask(
        token: string,
        taskId: number,
        file: File
    ): Promise<Attachment> {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            `${this.baseUrl}/v1/tasks/${taskId}/attachment/upload-file`,
            {
                method: "POST",
                headers: this.getAuthHeader(token),
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal mengunggah lampiran tugas.");
        }
        return response.json();
    }

    public async uploadLinkForTask(
        token: string,
        taskId: number,
        payload: AttachmentLinkCreate
    ): Promise<Attachment> {
        const response = await fetch(
            `${this.baseUrl}/v1/tasks/${taskId}/attachment/upload-link`,
            {
                method: "POST",
                headers: this.getAuthHeader(token, "application/json"),
                body: JSON.stringify(payload),
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal melampirkan link.");
        }
        return response.json();
    }

    public async uploadForComment(
        token: string,
        commentId: number,
        file: File
    ): Promise<Attachment> {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            `${this.baseUrl}/v1/comments/${commentId}/attachment/upload-file`,
            {
                method: "POST",
                headers: this.getAuthHeader(token),
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.message || "Gagal mengunggah lampiran komentar."
            );
        }
        return response.json();
    }

    public async uploadLinkForComment(
        token: string,
        commentId: number,
        payload: AttachmentLinkCreate
    ): Promise<Attachment> {
        const response = await fetch(
            `${this.baseUrl}/v1/comments/${commentId}/attachment/upload-link`,
            {
                method: "POST",
                headers: this.getAuthHeader(token, "application/json"),
                body: JSON.stringify(payload),
            }
        );
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal melampirkan link.");
        }
        return response.json();
    }

    public async deleteAttachment(
        token: string,
        attachmentId: number
    ): Promise<void> {
        const response = await fetch(
            `${this.baseUrl}/v1/attachment/${attachmentId}`,
            {
                method: "DELETE",
                headers: this.getAuthHeader(token),
            }
        );

        if (response.status !== 204) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Gagal menghapus lampiran.");
        }
    }
}

export const attachmentService = new AttachmentService();
