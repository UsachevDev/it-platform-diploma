import axios from "axios";
import { clearAccessToken, getAccessToken } from "./auth-token";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      const hadToken = Boolean(getAccessToken());
      clearAccessToken();

      const onAuthPage =
        window.location.pathname.startsWith("/login") ||
        window.location.pathname.startsWith("/register");

      if (hadToken && !onAuthPage) {
        window.location.replace("/login?expired=1");
      }
    }

    return Promise.reject(error);
  },
);
