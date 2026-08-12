import "server-only";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { createSupabaseServerClient } from "@/server/supabase/client";
import type {
  GroupMessageRecord,
  GroupRecord,
  JobRecord,
  LocationRecord,
  PlatformOwner,
  PlatformResult,
  ProductRecord,
  SearchResult,
  SearchResultSet,
  ServiceRecord,
} from "@/server/platform/types";

const ownerSelect = "id, username, display_name";

function owner(value: Record<string, unknown> | undefined): PlatformOwner | null {
  if (!value) return null;
  return {
    id: String(value.id),
    username: String(value.username),
    displayName: String(value.display_name || value.username),
  };
}

function pattern(value: string) {
  return `%${value
    .trim()
    .replace(/[\\%_]/g, "\\$&")
    .replace(/,/g, " ")}%`;
}

function productRecord(
  row: Record<string, unknown>,
  profile?: Record<string, unknown>,
): ProductRecord {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    category: row.category ? String(row.category) : null,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    currency: String(row.currency),
    locationLabel: row.location_label ? String(row.location_label) : null,
    latitude: row.latitude === null || row.latitude === undefined ? null : Number(row.latitude),
    longitude: row.longitude === null || row.longitude === undefined ? null : Number(row.longitude),
    status: row.status as ProductRecord["status"],
    createdAt: String(row.created_at),
    owner: owner(profile),
  };
}

function serviceRecord(
  row: Record<string, unknown>,
  profile?: Record<string, unknown>,
): ServiceRecord {
  const product = productRecord({ ...row, owner_user_id: row.provider_user_id }, profile);
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    category: product.category,
    price: product.price,
    currency: product.currency,
    locationLabel: product.locationLabel,
    latitude: product.latitude,
    longitude: product.longitude,
    status: product.status,
    createdAt: product.createdAt,
    providerUserId: String(row.provider_user_id),
    provider: owner(profile),
  };
}

function jobRecord(row: Record<string, unknown>, profile?: Record<string, unknown>): JobRecord {
  return {
    ...productRecord(row, profile),
    employerName: row.employer_name ? String(row.employer_name) : null,
    requirements: row.requirements ? String(row.requirements) : null,
    jobType: row.job_type ? String(row.job_type) : null,
    salaryMin:
      row.salary_min === null || row.salary_min === undefined ? null : Number(row.salary_min),
    salaryMax:
      row.salary_max === null || row.salary_max === undefined ? null : Number(row.salary_max),
  };
}

async function getProfiles(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ids: string[],
) {
  if (ids.length === 0) return new Map<string, Record<string, unknown>>();
  const { data } = await supabase.from("profiles").select(ownerSelect).in("id", ids);
  return new Map((data ?? []).map((item) => [String(item.id), item as Record<string, unknown>]));
}

export async function getProducts(limit = 24): Promise<PlatformResult<ProductRecord[]>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, owner_user_id, title, description, category, price, currency, location_label, latitude, longitude, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { status: "error", data: null };
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const profiles = await getProfiles(
      supabase,
      rows.map((row) => String(row.owner_user_id)),
    );
    return {
      status: "ok",
      data: rows.map((row) => productRecord(row, profiles.get(String(row.owner_user_id)))),
    };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getProduct(id: string): Promise<PlatformResult<ProductRecord | null>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, owner_user_id, title, description, category, price, currency, location_label, latitude, longitude, status, created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return { status: "error", data: null };
    const row = data as Record<string, unknown> | null;
    if (!row) return { status: "ok", data: null };
    const profiles = await getProfiles(supabase, [String(row.owner_user_id)]);
    return { status: "ok", data: productRecord(row, profiles.get(String(row.owner_user_id))) };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getServices(limit = 24): Promise<PlatformResult<ServiceRecord[]>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("services")
      .select(
        "id, provider_user_id, title, description, category, price, currency, location_label, latitude, longitude, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { status: "error", data: null };
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const profiles = await getProfiles(
      supabase,
      rows.map((row) => String(row.provider_user_id)),
    );
    return {
      status: "ok",
      data: rows.map((row) => serviceRecord(row, profiles.get(String(row.provider_user_id)))),
    };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getServicesById(id: string): Promise<PlatformResult<ServiceRecord | null>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("services")
      .select(
        "id, provider_user_id, title, description, category, price, currency, location_label, latitude, longitude, status, created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return { status: "error", data: null };
    const row = data as Record<string, unknown> | null;
    if (!row) return { status: "ok", data: null };
    const profiles = await getProfiles(supabase, [String(row.provider_user_id)]);
    return { status: "ok", data: serviceRecord(row, profiles.get(String(row.provider_user_id))) };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getJobs(limit = 24): Promise<PlatformResult<JobRecord[]>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, owner_user_id, title, employer_name, description, requirements, job_type, salary_min, salary_max, currency, location_label, latitude, longitude, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { status: "error", data: null };
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const profiles = await getProfiles(
      supabase,
      rows.map((row) => String(row.owner_user_id)),
    );
    return {
      status: "ok",
      data: rows.map((row) => jobRecord(row, profiles.get(String(row.owner_user_id)))),
    };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getJob(id: string): Promise<PlatformResult<JobRecord | null>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("jobs")
      .select(
        "id, owner_user_id, title, employer_name, description, requirements, job_type, salary_min, salary_max, currency, location_label, latitude, longitude, status, created_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) return { status: "error", data: null };
    const row = data as Record<string, unknown> | null;
    if (!row) return { status: "ok", data: null };
    const profiles = await getProfiles(supabase, [String(row.owner_user_id)]);
    return { status: "ok", data: jobRecord(row, profiles.get(String(row.owner_user_id))) };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getGroups(limit = 24): Promise<PlatformResult<GroupRecord[]>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("groups")
      .select("id, owner_user_id, name, description, visibility, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { status: "error", data: null };
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    const profiles = await getProfiles(
      supabase,
      rows.map((row) => String(row.owner_user_id)),
    );
    const groupIds = rows.map((row) => String(row.id));
    const { data: members } = groupIds.length
      ? await supabase
          .from("group_members")
          .select("group_id")
          .in("group_id", groupIds)
          .eq("status", "active")
      : { data: [] };
    const counts = new Map<string, number>();
    for (const item of members ?? [])
      counts.set(String(item.group_id), (counts.get(String(item.group_id)) ?? 0) + 1);
    return {
      status: "ok",
      data: rows.map((row) => ({
        id: String(row.id),
        ownerUserId: String(row.owner_user_id),
        name: String(row.name),
        description: row.description ? String(row.description) : null,
        visibility: row.visibility as GroupRecord["visibility"],
        status: row.status as GroupRecord["status"],
        createdAt: String(row.created_at),
        owner: owner(profiles.get(String(row.owner_user_id))),
        memberCount: counts.get(String(row.id)) ?? 0,
      })),
    };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getGroup(id: string): Promise<PlatformResult<GroupRecord | null>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("groups")
      .select("id, owner_user_id, name, description, visibility, status, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) return { status: "error", data: null };
    const row = data as Record<string, unknown> | null;
    if (!row) return { status: "ok", data: null };
    const profiles = await getProfiles(supabase, [String(row.owner_user_id)]);
    const { count } = await supabase
      .from("group_members")
      .select("user_id", { count: "exact", head: true })
      .eq("group_id", id)
      .eq("status", "active");
    return {
      status: "ok",
      data: {
        id: String(row.id),
        ownerUserId: String(row.owner_user_id),
        name: String(row.name),
        description: row.description ? String(row.description) : null,
        visibility: row.visibility as GroupRecord["visibility"],
        status: row.status as GroupRecord["status"],
        createdAt: String(row.created_at),
        owner: owner(profiles.get(String(row.owner_user_id))),
        memberCount: count ?? 0,
      },
    };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getLocationRecords(limit = 60): Promise<PlatformResult<LocationRecord[]>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  try {
    const [products, services, jobs] = await Promise.all([
      getProducts(limit),
      getServices(limit),
      getJobs(limit),
    ]);
    if (products.status === "error" || services.status === "error" || jobs.status === "error")
      return { status: "error", data: null };
    if (products.status !== "ok" || services.status !== "ok" || jobs.status !== "ok")
      return { status: "unavailable", data: null };
    return {
      status: "ok",
      data: [
        ...products.data
          .filter((item) => item.latitude !== null && item.longitude !== null)
          .map((item) => ({
            id: item.id,
            kind: "product" as const,
            title: item.title,
            locationLabel: item.locationLabel,
            latitude: item.latitude as number,
            longitude: item.longitude as number,
            href: `/en/products/${item.id}`,
          })),
        ...services.data
          .filter((item) => item.latitude !== null && item.longitude !== null)
          .map((item) => ({
            id: item.id,
            kind: "service" as const,
            title: item.title,
            locationLabel: item.locationLabel,
            latitude: item.latitude as number,
            longitude: item.longitude as number,
            href: `/en/services/${item.id}`,
          })),
        ...jobs.data
          .filter((item) => item.latitude !== null && item.longitude !== null)
          .map((item) => ({
            id: item.id,
            kind: "job" as const,
            title: item.title,
            locationLabel: item.locationLabel,
            latitude: item.latitude as number,
            longitude: item.longitude as number,
            href: `/en/jobs/${item.id}`,
          })),
      ],
    };
  } catch {
    return { status: "error", data: null };
  }
}

export async function getGroupMessages(
  groupId: string,
  limit = 50,
): Promise<PlatformResult<GroupMessageRecord[]>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("group_messages")
      .select("id, group_id, sender_id, body, created_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) return { status: "error", data: null };
    return {
      status: "ok",
      data: (data ?? []).map((row) => ({
        id: String(row.id),
        groupId: String(row.group_id),
        senderId: String(row.sender_id),
        body: String(row.body),
        createdAt: String(row.created_at),
      })),
    };
  } catch {
    return { status: "error", data: null };
  }
}

export async function searchPlatform(
  query: string,
  limit = 8,
): Promise<PlatformResult<SearchResultSet>> {
  const value = query.trim();
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  if (value.length < 2)
    return {
      status: "ok",
      data: {
        query: value,
        results: { users: [], products: [], services: [], jobs: [], groups: [] },
        total: 0,
      },
    };
  try {
    const supabase = await createSupabaseServerClient();
    const like = pattern(value);
    const [users, products, services, jobs, groups] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, location_label")
        .or(`username.ilike.${like},display_name.ilike.${like}`)
        .is("deleted_at", null)
        .limit(limit),
      supabase
        .from("products")
        .select("id, title, location_label")
        .ilike("title", like)
        .eq("status", "published")
        .is("deleted_at", null)
        .limit(limit),
      supabase
        .from("services")
        .select("id, title, location_label")
        .ilike("title", like)
        .eq("status", "published")
        .is("deleted_at", null)
        .limit(limit),
      supabase
        .from("jobs")
        .select("id, title, location_label")
        .ilike("title", like)
        .eq("status", "published")
        .is("deleted_at", null)
        .limit(limit),
      supabase
        .from("groups")
        .select("id, name, description")
        .ilike("name", like)
        .eq("status", "active")
        .limit(limit),
    ]);
    if ([users, products, services, jobs, groups].some((result) => result.error))
      return { status: "error", data: null };
    const results: Record<SearchResult["category"], SearchResult[]> = {
      users: (users.data ?? []).map((item) => ({
        category: "users",
        id: String(item.id),
        title: String(item.display_name || item.username),
        subtitle: `@${item.username}`,
        href: `/en/u/${item.username}`,
        locationLabel: item.location_label,
      })),
      products: (products.data ?? []).map((item) => ({
        category: "products",
        id: String(item.id),
        title: String(item.title),
        subtitle: "Product",
        href: `/en/products/${item.id}`,
        locationLabel: item.location_label,
      })),
      services: (services.data ?? []).map((item) => ({
        category: "services",
        id: String(item.id),
        title: String(item.title),
        subtitle: "Service",
        href: `/en/services/${item.id}`,
        locationLabel: item.location_label,
      })),
      jobs: (jobs.data ?? []).map((item) => ({
        category: "jobs",
        id: String(item.id),
        title: String(item.title),
        subtitle: "Job",
        href: `/en/jobs/${item.id}`,
        locationLabel: item.location_label,
      })),
      groups: (groups.data ?? []).map((item) => ({
        category: "groups",
        id: String(item.id),
        title: String(item.name),
        subtitle: item.description ? String(item.description) : "Group",
        href: `/en/groups/${item.id}`,
      })),
    };
    return {
      status: "ok",
      data: {
        query: value,
        results,
        total: Object.values(results).reduce((total, list) => total + list.length, 0),
      },
    };
  } catch {
    return { status: "error", data: null };
  }
}
