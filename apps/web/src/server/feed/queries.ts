import "server-only";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";
import { getMediaSignedUrls } from "@/server/media/urls";
import {
  getProfiles,
  jobRecord,
  productRecord,
  serviceRecord,
} from "@/server/platform/queries";
import type { JobRecord, ProductRecord, ServiceRecord } from "@/server/platform/types";
import { getPostsPage } from "@/server/posts/queries";
import type { FeedCursor, FeedItem, FeedListResult, FeedQueryResult } from "@/server/feed/types";

const defaultPerPage = 12;

async function queryPlatformPage<T extends { id: string; createdAt: string }>(
  table: "products" | "services" | "jobs",
  select: string,
  offset: number,
  limit: number,
  mapRow: (row: Record<string, unknown>, profile?: Record<string, unknown>) => T,
): Promise<T[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);
  if (error) return [];
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  const mediaUrls = await getMediaSignedUrls(
    rows.flatMap((row) => (row.image_media_asset_id ? [String(row.image_media_asset_id)] : [])),
  );
  const rowsWithMedia: Array<Record<string, unknown>> = rows.map((row) => ({
    ...row,
    image_url: row.image_media_asset_id
      ? (mediaUrls.get(String(row.image_media_asset_id)) ?? null)
      : null,
  }));
  const ownerColumn = table === "services" ? "provider_user_id" : "owner_user_id";
  const profiles = await getProfiles(
    supabase,
    rowsWithMedia.map((row) => String(row[ownerColumn])),
  );
  return rowsWithMedia.map((row) => mapRow(row, profiles.get(String(row[ownerColumn]))));
}

export async function getUnifiedFeed(
  cursor: FeedCursor | null,
  limit = defaultPerPage,
): Promise<FeedQueryResult<FeedListResult>> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };

  try {
    const user = await getCurrentUser();
    if (!user) return { status: "error", data: null };

    const postOffset = cursor?.post ?? 0;
    const productOffset = cursor?.product ?? 0;
    const serviceOffset = cursor?.service ?? 0;
    const jobOffset = cursor?.job ?? 0;

    const [posts, products, services, jobs] = await Promise.all([
      getPostsPage(postOffset, limit),
      queryPlatformPage<ProductRecord>(
        "products",
        "id, owner_user_id, title, description, category, price, currency, location_label, latitude, longitude, status, created_at, image_media_asset_id",
        productOffset,
        6,
        productRecord,
      ),
      queryPlatformPage<ServiceRecord>(
        "services",
        "id, provider_user_id, title, description, category, price, currency, location_label, latitude, longitude, status, created_at, image_media_asset_id",
        serviceOffset,
        6,
        serviceRecord,
      ),
      queryPlatformPage<JobRecord>(
        "jobs",
        "id, owner_user_id, title, description, category, price, currency, location_label, latitude, longitude, status, created_at, image_media_asset_id, employer_name, requirements, job_type, salary_min, salary_max",
        jobOffset,
        6,
        jobRecord,
      ),
    ]);

    const items: FeedItem[] = [
      ...posts.map((item) => ({ kind: "post" as const, item })),
      ...products.map((item) => ({ kind: "product" as const, item })),
      ...services.map((item) => ({ kind: "service" as const, item })),
      ...jobs.map((item) => ({ kind: "job" as const, item })),
    ].sort((a, b) => (a.item.createdAt < b.item.createdAt ? 1 : -1));

    const hasMore = posts.length + products.length + services.length + jobs.length >= 4;
    const nextCursor: FeedCursor = {
      post: postOffset + posts.length,
      product: productOffset + products.length,
      service: serviceOffset + services.length,
      job: jobOffset + jobs.length,
    };

    return {
      status: "ok",
      data: { items, nextCursor: hasMore ? nextCursor : null, hasMore },
    };
  } catch {
    return { status: "error", data: null };
  }
}