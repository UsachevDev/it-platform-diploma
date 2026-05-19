import { apiClient } from "@/lib/api/client";
import type { UserRole } from "@/lib/auth/auth-types";

export type ProjectStatus = "OPEN" | "IN_WORK" | "DONE" | "CANCELED";

export type ProjectSortBy = "newest" | "budgetAsc" | "budgetDesc";

export type ProjectUserRef = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Project = {
  id: string;
  customerId: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  status: ProjectStatus;
  selectedContractorId: string | null;
  createdAt: string;
  updatedAt: string;
  customer: ProjectUserRef;
  selectedContractor: ProjectUserRef | null;
  _count: {
    bids: number;
  };
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProjectsListResponse = {
  data: Project[];
  meta: PaginationMeta;
};

export type GetProjectsQuery = {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  search?: string;
  budgetMin?: number;
  budgetMax?: number;
  sortBy?: ProjectSortBy;
};

export type CreateProjectDto = {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
};

export type UpdateProjectDto = Partial<CreateProjectDto>;

export async function getProjectsRequest(
  query: GetProjectsQuery = {},
): Promise<ProjectsListResponse> {
  const { data } = await apiClient.get<ProjectsListResponse>("/projects", {
    params: query,
  });
  return data;
}

export async function getProjectByIdRequest(id: string): Promise<Project> {
  const { data } = await apiClient.get<Project>(`/projects/${id}`);
  return data;
}

export async function createProjectRequest(
  dto: CreateProjectDto,
): Promise<Project> {
  const { data } = await apiClient.post<Project>("/projects", dto);
  return data;
}

export async function updateProjectRequest(
  id: string,
  dto: UpdateProjectDto,
): Promise<Project> {
  const { data } = await apiClient.patch<Project>(`/projects/${id}`, dto);
  return data;
}

export async function cancelProjectRequest(id: string): Promise<Project> {
  const { data } = await apiClient.post<Project>(`/projects/${id}/cancel`);
  return data;
}

export async function completeProjectRequest(id: string): Promise<Project> {
  const { data } = await apiClient.post<Project>(`/projects/${id}/done`);
  return data;
}
