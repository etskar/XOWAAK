import "server-only";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";
import { getProfiles, owner } from "@/server/platform/queries";
import type { ApplicationStatus, OrderStatus } from "@/server/platform/commerce-actions";

export interface CommerceOrderRecord {
  id: string;
  targetType: "product" | "service";
  targetId: string;
  title: string | null;
  message: string | null;
  priceSnapshot: number | null;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  counterpart: { id: string; username: string; displayName: string } | null;
}

export interface CommerceApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string | null;
  message: string | null;
  status: ApplicationStatus;
  createdAt: string;
  counterpart: { id: string; username: string; displayName: string } | null;
}

export interface OrderCenterResult {
  status: "ok" | "unavailable" | "error";
  data: {
    receivedOrders: CommerceOrderRecord[];
    sentOrders: CommerceOrderRecord[];
    receivedApplications: CommerceApplicationRecord[];
    sentApplications: CommerceApplicationRecord[];
  } | null;
}

export async function getOrderCenter(): Promise<OrderCenterResult> {
  if (!hasSupabasePublicEnv()) return { status: "unavailable", data: null };
  try {
    const supabase = await createSupabaseServerClient();
    const user = await getCurrentUser();
    if (!user) return { status: "ok", data: null };

    const [ownedProducts, ownedServices, ownedJobs, allOrders, myApplications] =
      await Promise.all([
        supabase.from("products").select("id").eq("owner_user_id", user.id),
        supabase.from("services").select("id").eq("provider_user_id", user.id),
        supabase.from("jobs").select("id").eq("owner_user_id", user.id),
        supabase
          .from("orders")
          .select(
            "id, requester_user_id, target_type, target_id, message, price_snapshot, currency, status, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("job_applications")
          .select("id, applicant_user_id, job_id, message, status, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

    if ([ownedProducts, ownedServices, ownedJobs, allOrders, myApplications].some((r) => r.error))
      return { status: "error", data: null };

    const productIds = (ownedProducts.data ?? []).map((row) => String(row.id));
    const serviceIds = (ownedServices.data ?? []).map((row) => String(row.id));
    const jobIds = (ownedJobs.data ?? []).map((row) => String(row.id));

    const ownedTargetIds = new Set<string>([...productIds, ...serviceIds]);
    const myApplicationJobIds = new Set<string>(
      (myApplications.data ?? []).map((row) => String(row.job_id)),
    );
    const jobIdSet = new Set<string>([...jobIds, ...myApplicationJobIds]);

    const orderRows = (allOrders.data ?? []) as Array<Record<string, unknown>>;
    const orders = orderRows.filter(
      (row) =>
        String(row.requester_user_id) === user.id ||
        ownedTargetIds.has(String(row.target_id)),
    );
    const receivedOrders = orders.filter(
      (row) => String(row.requester_user_id) !== user.id,
    );
    const sentOrders = orders.filter((row) => String(row.requester_user_id) === user.id);

    const applicationRows = (myApplications.data ?? []) as Array<Record<string, unknown>>;
    const applications = applicationRows.filter(
      (row) => String(row.applicant_user_id) === user.id || jobIds.includes(String(row.job_id)),
    );
    const receivedApplications = applications.filter(
      (row) => String(row.applicant_user_id) !== user.id,
    );
    const sentApplications = applications.filter(
      (row) => String(row.applicant_user_id) === user.id,
    );

    const targetIds = [...new Set(orders.map((row) => String(row.target_id)))];
    const allJobIds = [...jobIdSet];

    const [targetProducts, targetServices, targetJobs] = await Promise.all([
      supabase
        .from("products")
        .select("id, title, owner_user_id")
        .in("id", targetIds.length ? targetIds : ["00000000-0000-0000-0000-000000000000"]),
      supabase
        .from("services")
        .select("id, title, provider_user_id")
        .in("id", targetIds.length ? targetIds : ["00000000-0000-0000-0000-000000000000"]),
      supabase
        .from("jobs")
        .select("id, title, owner_user_id")
        .in("id", allJobIds.length ? allJobIds : ["00000000-0000-0000-0000-000000000000"]),
    ]);
    if ([targetProducts, targetServices, targetJobs].some((r) => r.error))
      return { status: "error", data: null };

    const targetTitles = new Map<string, string>();
    const targetOwnerIds = new Map<string, string>();
    for (const item of targetProducts.data ?? []) {
      targetTitles.set(String(item.id), String(item.title));
      targetOwnerIds.set(String(item.id), String(item.owner_user_id));
    }
    for (const item of targetServices.data ?? []) {
      targetTitles.set(String(item.id), String(item.title));
      targetOwnerIds.set(String(item.id), String(item.provider_user_id));
    }

    const jobTitles = new Map<string, string>();
    const jobOwnerIds = new Map<string, string>();
    for (const item of targetJobs.data ?? []) {
      jobTitles.set(String(item.id), String(item.title));
      jobOwnerIds.set(String(item.id), String(item.owner_user_id));
    }

    const counterpartIds = [
      ...new Set([
        ...receivedOrders.map((row) => String(row.requester_user_id)),
        ...sentOrders.map((row) => targetOwnerIds.get(String(row.target_id)) ?? ""),
        ...receivedApplications.map((row) => String(row.applicant_user_id)),
        ...sentApplications.map((row) => jobOwnerIds.get(String(row.job_id)) ?? ""),
      ]),
    ].filter(Boolean);
    const profiles = await getProfiles(supabase, counterpartIds);

    const mapOrder = (
      row: Record<string, unknown>,
      counterpartUserId: string | null,
    ): CommerceOrderRecord => ({
      id: String(row.id),
      targetType: row.target_type as CommerceOrderRecord["targetType"],
      targetId: String(row.target_id),
      title: targetTitles.get(String(row.target_id)) ?? null,
      message: row.message ? String(row.message) : null,
      priceSnapshot:
        row.price_snapshot === null || row.price_snapshot === undefined
          ? null
          : Number(row.price_snapshot),
      currency: String(row.currency),
      status: row.status as OrderStatus,
      createdAt: String(row.created_at),
      counterpart: counterpartUserId
        ? owner(profiles.get(counterpartUserId))
        : null,
    });

    const mapApplication = (
      row: Record<string, unknown>,
      counterpartUserId: string | null,
    ): CommerceApplicationRecord => ({
      id: String(row.id),
      jobId: String(row.job_id),
      jobTitle: jobTitles.get(String(row.job_id)) ?? null,
      message: row.message ? String(row.message) : null,
      status: row.status as ApplicationStatus,
      createdAt: String(row.created_at),
      counterpart: counterpartUserId
        ? owner(profiles.get(counterpartUserId))
        : null,
    });

    return {
      status: "ok",
      data: {
        receivedOrders: receivedOrders.map((row) =>
          mapOrder(row, String(row.requester_user_id)),
        ),
        sentOrders: sentOrders.map((row) =>
          mapOrder(row, targetOwnerIds.get(String(row.target_id)) ?? null),
        ),
        receivedApplications: receivedApplications.map((row) =>
          mapApplication(row, String(row.applicant_user_id)),
        ),
        sentApplications: sentApplications.map((row) =>
          mapApplication(row, jobOwnerIds.get(String(row.job_id)) ?? null),
        ),
      },
    };
  } catch {
    return { status: "error", data: null };
  }
}