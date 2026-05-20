export type UserRole = "CUSTOMER" | "CONTRACTOR" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  about?: string | null;
  skills?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type RegisterDto = {
  email: string;
  password: string;
  name: string;
  role: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};
