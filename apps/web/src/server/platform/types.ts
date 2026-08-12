import type { Locale } from "@/config/locales";

export type PlatformStatus = "draft" | "published" | "archived";

export type PlatformOwner = {
  id: string;
  username: string;
  displayName: string;
};

export type ProductRecord = {
  id: string;
  ownerUserId: string;
  title: string;
  description: string | null;
  category: string | null;
  price: number | null;
  currency: string;
  locationLabel: string | null;
  latitude: number | null;
  longitude: number | null;
  status: PlatformStatus;
  createdAt: string;
  owner: PlatformOwner | null;
};

export type ServiceRecord = Omit<ProductRecord, "ownerUserId" | "owner"> & {
  providerUserId: string;
  provider: PlatformOwner | null;
};

export type JobRecord = ProductRecord & {
  employerName: string | null;
  requirements: string | null;
  jobType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
};

export type GroupRecord = {
  id: string;
  ownerUserId: string;
  name: string;
  description: string | null;
  visibility: "public" | "private";
  status: "active" | "archived";
  createdAt: string;
  owner: PlatformOwner | null;
  memberCount: number;
};

export type GroupMessageRecord = {
  id: string;
  groupId: string;
  senderId: string;
  body: string;
  createdAt: string;
};

export type LocationRecord = {
  id: string;
  kind: "product" | "service" | "job";
  title: string;
  locationLabel: string | null;
  latitude: number;
  longitude: number;
  href: string;
};

export type PlatformResult<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable"; data: null }
  | { status: "error"; data: null };

export type SearchCategory = "users" | "products" | "services" | "jobs" | "groups";

export type SearchResult = {
  category: SearchCategory;
  id: string;
  title: string;
  subtitle: string;
  href: string;
  locationLabel?: string | null;
};

export type SearchResultSet = {
  query: string;
  results: Record<SearchCategory, SearchResult[]>;
  total: number;
};

export type PlatformLocaleProps = { locale: Locale };
