import { apiClient } from "@/lib/api/client";

export async function getSkillsRequest(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>("/skills");
  return data;
}
