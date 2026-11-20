export interface DictionaryItem {
  id: number;
  name: string;
}

export interface Offer {
  id: number;
  name: string;
  state: string | null;
  country: string[];
  group: string | null;
}

export interface Dictionaries {
  domains: DictionaryItem[];
  groups: DictionaryItem[];
  traffic_sources: DictionaryItem[];
  offers: Offer[];
}

export interface StreamOffer {
  offer_id: number;
  share: number;
  state: string | null;
}

export interface Stream {
  id: number;
  name: string;
  type: string | null;
  schema: string | null;
  action_type: string | null;
  state: string | null;
  weight: number | null;
  offers: StreamOffer[];
  filters: { name?: string; mode?: string; payload?: string[] }[];
  action_options: Record<string, unknown>;
}

export interface Campaign {
  id: number;
  name: string;
  alias: string | null;
  state: string | null;
  domain: string | null;
  group_id: number | null;
  traffic_source_id: number | null;
  token: string | null;
}

export interface CampaignWithStreams {
  campaign: Campaign;
  streams: Stream[];
}

export interface CreateCampaignRequest {
  name: string;
  geo: string;
  offer_id: number;
  domain_id: number;
  group_id: number;
  traffic_source_id: number;
}
