import { apiClient } from "@/lib/api/client";
import type { AuthUser } from "@/lib/auth/auth-types";

export type UpdateUserDto = {
  name?: string;
  about?: string | null;
  skills?: string[];
};

export type UpdateEmailDto = {
  newEmail: string;
  currentPassword: string;
};

export type UpdatePasswordDto = {
  currentPassword: string;
  newPassword: string;
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

export async function updateEmailRequest(
  dto: UpdateEmailDto,
): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>("/users/me/email", dto);
  return data;
}

export async function updatePasswordRequest(
  dto: UpdatePasswordDto,
): Promise<{ message: string }> {
  const { data } = await apiClient.patch<{ message: string }>(
    "/users/me/password",
    dto,
  );
  return data;
}
