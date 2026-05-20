import { apiClient } from "@/lib/api/client";

export type NotificationType =
  | "BID_RECEIVED"
  | "BID_ACCEPTED"
  | "BID_REJECTED"
  | "PROJECT_COMPLETED"
  | "REVIEW_RECEIVED";

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationsResponse = {
  items: AppNotification[];
  unreadCount: number;
};

export async function getNotificationsRequest(): Promise<NotificationsResponse> {
  const { data } = await apiClient.get<NotificationsResponse>("/notifications");
  return data;
}

export async function markNotificationReadRequest(
  id: string,
): Promise<AppNotification> {
  const { data } = await apiClient.post<AppNotification>(
    `/notifications/${id}/read`,
  );
  return data;
}

export async function markAllNotificationsReadRequest(): Promise<{
  message: string;
}> {
  const { data } = await apiClient.post<{ message: string }>(
    "/notifications/read-all",
  );
  return data;
}
