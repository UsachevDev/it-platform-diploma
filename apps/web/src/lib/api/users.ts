import { apiClient } from "@/lib/api/client";
import type { AuthUser } from "@/lib/auth/auth-types";

export type UpdateUserDto = {
  name?: string;
  about?: string | null;
  skills?: string[];
};

export async function getMeRequest(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/users/me");
  return data;
}

export async function updateMeRequest(dto: UpdateUserDto): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>("/users/me", dto);
  return data;
}

export async function getUserByIdRequest(id: string): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>(`/users/${id}`);
  return data;
}
