import axios, { type AxiosError } from "axios";

type ApiErrorData = {
  message?: string | string[];
};

export function getApiErrorMessage(
  error: unknown,
  fallback = "Что-то пошло не так. Попробуйте позже.",
): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorData>;
    const message = axiosError.response?.data?.message;

    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}
