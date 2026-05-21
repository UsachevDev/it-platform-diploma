import { apiClient } from "@/lib/api/client";
import type {
  AuthResponse,
  AuthUser,
  LoginDto,
  RegisterDto,
} from "@/lib/auth/auth-types";

export async function loginRequest(dto: LoginDto): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", dto);
  return data;
}

export async function registerRequest(dto: RegisterDto): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", dto);
  return data;
}

export async function getMeRequest(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>("/auth/me");
  return data;
}
