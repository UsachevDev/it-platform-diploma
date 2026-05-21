import { apiClient } from "@/lib/api/client";
import type { Bid, BidStatus } from "@/lib/api/bids";
import type {
  PaginationMeta,
  Project,
  ProjectStatus,
} from "@/lib/api/projects";
import type { UserRole } from "@/lib/auth/auth-types";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  about: string | null;
  skills: string[];
  isBlocked: boolean;
  blockReason: string | null;
  blockedUntil: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    customerProjects: number;
    contractorBids: number;
  };
};

export type BlockUserDto = {
  reason: string;
  durationDays?: number;
};

export type AdminUsersQuery = {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
  blocked?: boolean;
};

export type AdminUsersResponse = {
  data: AdminUser[];
  meta: PaginationMeta;
};

export type AdminUserDetail = AdminUser & {
  customerProjects: Project[];
  contractorBids: Bid[];
};

export type AdminProjectsQuery = {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  search?: string;
};

export type AdminBidsQuery = {
  page?: number;
  limit?: number;
  status?: BidStatus;
  search?: string;
};

export type AdminProjectsResponse = {
  data: Project[];
  meta: PaginationMeta;
};

export type AdminBidsResponse = {
  data: Bid[];
  meta: PaginationMeta;
};

export type AdminStats = {
  users: {
    total: number;
    customers: number;
    contractors: number;
    blocked: number;
  };
  projects: {
    total: number;
    open: number;
    inWork: number;
    done: number;
    canceled: number;
  };
  bids: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
};

export type { BidStatus, ProjectStatus };

export async function getAdminStatsRequest(): Promise<AdminStats> {
  const { data } = await apiClient.get<AdminStats>("/admin/stats");
  return data;
}

export async function getAdminUsersRequest(
  query: AdminUsersQuery = {},
): Promise<AdminUsersResponse> {
  const { data } = await apiClient.get<AdminUsersResponse>("/admin/users", {
    params: query,
  });
  return data;
}

export async function getAdminUserDetailRequest(
  userId: string,
): Promise<AdminUserDetail> {
  const { data } = await apiClient.get<AdminUserDetail>(
    `/admin/users/${userId}`,
  );
  return data;
}

export async function blockUserRequest(
  userId: string,
  dto: BlockUserDto,
): Promise<AdminUser> {
  const { data } = await apiClient.post<AdminUser>(
    `/admin/users/${userId}/block`,
    dto,
  );
  return data;
}

export async function unblockUserRequest(userId: string): Promise<AdminUser> {
  const { data } = await apiClient.post<AdminUser>(
    `/admin/users/${userId}/unblock`,
  );
  return data;
}

export async function updateUserRoleRequest(
  userId: string,
  role: UserRole,
): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(
    `/admin/users/${userId}/role`,
    { role },
  );
  return data;
}

export async function deleteUserRequest(
  userId: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(
    `/admin/users/${userId}`,
  );
  return data;
}

export async function getAdminProjectsRequest(
  query: AdminProjectsQuery = {},
): Promise<AdminProjectsResponse> {
  const { data } = await apiClient.get<AdminProjectsResponse>(
    "/admin/projects",
    { params: query },
  );
  return data;
}

export async function cancelProjectAsAdminRequest(
  projectId: string,
): Promise<Project> {
  const { data } = await apiClient.post<Project>(
    `/admin/projects/${projectId}/cancel`,
  );
  return data;
}

export async function deleteProjectAsAdminRequest(
  projectId: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(
    `/admin/projects/${projectId}`,
  );
  return data;
}

export async function getAdminBidsRequest(
  query: AdminBidsQuery = {},
): Promise<AdminBidsResponse> {
  const { data } = await apiClient.get<AdminBidsResponse>("/admin/bids", {
    params: query,
  });
  return data;
}

export async function deleteBidAsAdminRequest(
  bidId: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(
    `/admin/bids/${bidId}`,
  );
  return data;
}
