"use server";

import { z } from "zod";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/client";

export type CommerceErrorCode =
  | "unavailable"
  | "unauthenticated"
  | "validation"
  | "forbidden"
  | "conflict"
  | "not_found"
  | "error";

export type CommerceActionResult =
  | { ok: true; id: string }
  | { ok: false; code: CommerceErrorCode };

export type OrderStatus = "pending" | "accepted" | "declined" | "cancelled" | "completed";
export type ApplicationStatus = "pending" | "shortlisted" | "rejected" | "hired" | "withdrawn";

function errorCode(error: { code?: string }): CommerceErrorCode {
  if (error.code === "23505") return "conflict";
  if (error.code === "42501") return "forbidden";
  return "error";
}

const messageSchema = z.string().trim().max(2000).optional();

async function resolveTarget(
  targetType: "product" | "service",
  targetId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const table = targetType === "product" ? "products" : "services";
  const { data, error } = await supabase
    .from(table)
    .select("price, currency")
    .eq("id", targetId)
    .maybeSingle();
  if (error || !data) return null;
  return { price: data.price === null ? null : Number(data.price), currency: String(data.currency) };
}

export async function createOrder(input: unknown): Promise<CommerceActionResult> {
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  const parsed = z
    .object({
      targetType: z.enum(["product", "service"]),
      targetId: z.string().uuid(),
      message: messageSchema,
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const target = await resolveTarget(parsed.data.targetType, parsed.data.targetId, supabase);
    if (!target) return { ok: false, code: "not_found" };
    const { data, error } = await supabase
      .from("orders")
      .insert({
        requester_user_id: user.id,
        target_type: parsed.data.targetType,
        target_id: parsed.data.targetId,
        message: parsed.data.message || null,
        price_snapshot: target.price,
        currency: target.currency,
      })
      .select("id")
      .single();
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: String(data.id) };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function createJobApplication(input: unknown): Promise<CommerceActionResult> {
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  const parsed = z
    .object({ jobId: z.string().uuid(), message: messageSchema })
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", parsed.data.jobId)
      .maybeSingle();
    if (jobError || !job) return { ok: false, code: "not_found" };
    const { data, error } = await supabase
      .from("job_applications")
      .insert({
        applicant_user_id: user.id,
        job_id: parsed.data.jobId,
        message: parsed.data.message || null,
      })
      .select("id")
      .single();
    return error ? { ok: false, code: errorCode(error) } : { ok: true, id: String(data.id) };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function updateOrderStatus(
  input: unknown,
): Promise<{ ok: boolean; code?: CommerceErrorCode }> {
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  const parsed = z
    .object({ orderId: z.string().uuid(), status: z.enum(["accepted", "declined", "cancelled", "completed"]) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("update_order_status", {
      order_id: parsed.data.orderId,
      new_status: parsed.data.status,
    });
    if (error) return { ok: false, code: errorCode(error) };
    return data === true ? { ok: true } : { ok: false, code: "forbidden" };
  } catch {
    return { ok: false, code: "error" };
  }
}

export async function updateJobApplicationStatus(
  input: unknown,
): Promise<{ ok: boolean; code?: CommerceErrorCode }> {
  if (!hasSupabasePublicEnv()) return { ok: false, code: "unavailable" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "unauthenticated" };
  const parsed = z
    .object({
      applicationId: z.string().uuid(),
      status: z.enum(["shortlisted", "rejected", "hired", "withdrawn"]),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, code: "validation" };
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("update_job_application_status", {
      application_id: parsed.data.applicationId,
      new_status: parsed.data.status,
    });
    if (error) return { ok: false, code: errorCode(error) };
    return data === true ? { ok: true } : { ok: false, code: "forbidden" };
  } catch {
    return { ok: false, code: "error" };
  }
}