import { apiClient } from "@/lib/api/client";
import type { ProjectUserRef } from "@/lib/api/projects";

export type Review = {
  id: string;
  projectId: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: ProjectUserRef;
  target: ProjectUserRef;
};

export type UserReviews = {
  averageRating: number | null;
  count: number;
  reviews: Review[];
};

export type CreateReviewDto = {
  rating: number;
  comment: string;
};

export async function createReviewRequest(
  projectId: string,
  dto: CreateReviewDto,
): Promise<Review> {
  const { data } = await apiClient.post<Review>(
    `/projects/${projectId}/reviews`,
    dto,
  );
  return data;
}

export async function getProjectReviewsRequest(
  projectId: string,
): Promise<Review[]> {
  const { data } = await apiClient.get<Review[]>(
    `/projects/${projectId}/reviews`,
  );
  return data;
}

export async function getUserReviewsRequest(
  userId: string,
): Promise<UserReviews> {
  const { data } = await apiClient.get<UserReviews>(
    `/users/${userId}/reviews`,
  );
  return data;
}
