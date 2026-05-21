import { apiClient } from "@/lib/api/client";
import type { ProjectStatus, ProjectUserRef } from "@/lib/api/projects";

export type BidStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type BidProjectRef = {
  id: string;
  title: string;
  description?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  status: ProjectStatus;
  createdAt?: string;
  customerId?: string;
  selectedContractorId?: string | null;
};

export type Bid = {
  id: string;
  projectId: string;
  contractorId: string;
  price: number;
  durationDays: number;
  coverLetter: string;
  status: BidStatus;
  createdAt: string;
  updatedAt: string;
  contractor?: ProjectUserRef;
  project?: BidProjectRef;
};

export type CreateBidDto = {
  price: number;
  durationDays: number;
  coverLetter: string;
};

export type UpdateBidDto = Partial<CreateBidDto>;

export type AcceptBidResponse = {
  message: string;
  bid: Bid;
  project: {
    id: string;
    title: string;
    status: ProjectStatus;
    selectedContractorId: string | null;
  };
};

export async function createBidRequest(
  projectId: string,
  dto: CreateBidDto,
): Promise<Bid> {
  const { data } = await apiClient.post<Bid>(
    `/projects/${projectId}/bids`,
    dto,
  );
  return data;
}

export async function getBidsByProjectRequest(
  projectId: string,
): Promise<Bid[]> {
  const { data } = await apiClient.get<Bid[]>(`/projects/${projectId}/bids`);
  return data;
}

export async function getMyBidsRequest(): Promise<Bid[]> {
  const { data } = await apiClient.get<Bid[]>("/bids/my");
  return data;
}

export async function acceptBidRequest(
  bidId: string,
): Promise<AcceptBidResponse> {
  const { data } = await apiClient.post<AcceptBidResponse>(
    `/bids/${bidId}/accept`,
  );
  return data;
}

export async function rejectBidRequest(bidId: string): Promise<Bid> {
  const { data } = await apiClient.post<Bid>(`/bids/${bidId}/reject`);
  return data;
}

export async function updateBidRequest(
  bidId: string,
  dto: UpdateBidDto,
): Promise<Bid> {
  const { data } = await apiClient.patch<Bid>(`/bids/${bidId}`, dto);
  return data;
}

export async function deleteBidRequest(
  bidId: string,
): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(
    `/bids/${bidId}`,
  );
  return data;
}
