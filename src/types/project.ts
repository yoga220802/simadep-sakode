// Tipe untuk status proyek, sesuai dengan yang ada di backend
export type ProjectStatus = "tender" | "active" | "completed" | "cancel";

// Tipe untuk peran anggota dalam proyek
export type ProjectRole = "owner" | "contributor" | "viewer";

// Tipe untuk data anggota proyek
export interface ProjectMember {
	user_id: number;
	name: string;
	email: string;
	project_role: ProjectRole;
	profile_url: string;
}

// Tipe untuk statistik proyek
export interface ProjectStats {
	total_tasks: number;
	total_completed_tasks: number;
}

// Tipe untuk ringkasan proyek dari API
export interface ProjectSummary {
	total_project: number;
	project_active: number;
	project_completed: number;
	project_tender: number;
	project_cancel: number;
}

// Tipe untuk data proyek tunggal yang diterima dari API
export interface Project {
	id: number;
	title: string;
	description: string | null;
	start_date: string | null;
	end_date: string | null;
	status: ProjectStatus;
	created_by: number;
	members?: ProjectMember[];
	total_tasks: number;
}

// Tipe untuk respons paginasi dari API GET /v1/projects
export interface PaginatedProjectsResponse {
	count: number;
	items: Project[];
	curr_page: number;
	total_page: number;
	next_page: string | null;
	previous_page: string | null;
	summary: ProjectSummary; // Tambahkan properti summary
}

// Tipe untuk data yang dikirim saat membuat atau mengedit proyek
export interface ProjectFormData {
	title: string;
	description?: string;
	start_date?: string;
	end_date?: string;
	status: ProjectStatus;
}
