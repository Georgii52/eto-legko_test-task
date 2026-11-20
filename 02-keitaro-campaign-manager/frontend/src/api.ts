import type {
  Campaign,
  CampaignWithStreams,
  CreateCampaignRequest,
  Dictionaries,
  Stream,
} from "./types";

class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${response.status}`;
    throw new ApiError(message);
  }
  return body as T;
}

export const api = {
  dictionaries: () => request<Dictionaries>("/api/dictionaries"),
  campaigns: (limit = 100) => request<Campaign[]>(`/api/campaigns?limit=${limit}`),
  campaign: (id: number) => request<CampaignWithStreams>(`/api/campaigns/${id}`),
  createCampaign: (body: CreateCampaignRequest) =>
    request<CampaignWithStreams>("/api/campaigns", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  addOfferStream: (campaignId: number, offerId: number) =>
    request<Stream>(`/api/campaigns/${campaignId}/streams`, {
      method: "POST",
      body: JSON.stringify({ offer_id: offerId }),
    }),
  mutateOffers: (streamId: number, action: "add" | "remove", offerId: number) =>
    request<Stream>(`/api/streams/${streamId}/offers`, {
      method: "PUT",
      body: JSON.stringify({ action, offer_id: offerId }),
    }),
  deleteStream: (streamId: number) =>
    request<void>(`/api/streams/${streamId}`, { method: "DELETE" }),
};
