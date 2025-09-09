export interface Category {
    id: number;
    project_id: number;
    name: string;
    description: string | null;
}

export interface CategoryCreatePayload {
    name: string;
    description?: string;
}

export interface CategoryUpdatePayload {
    name?: string;
    description?: string;
}
