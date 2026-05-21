import { apiClient } from "@/lib/api/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
};

export async function getCategoriesRequest(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}
