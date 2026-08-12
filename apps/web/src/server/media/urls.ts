import "server-only";

import { createSupabaseAdminClient } from "@/server/supabase/admin";

export async function getMediaSignedUrls(assetIds: string[], expiresIn = 3600) {
  const urls = new Map<string, string>();
  if (assetIds.length === 0) return urls;

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("media_assets")
      .select("id, bucket, object_path, status")
      .in("id", assetIds)
      .in("status", ["pending", "ready"]);
    await Promise.all(
      (data ?? []).map(async (asset) => {
        const { data: signed } = await supabase.storage
          .from(String(asset.bucket))
          .createSignedUrl(String(asset.object_path), expiresIn);
        if (signed?.signedUrl) urls.set(String(asset.id), signed.signedUrl);
      }),
    );
  } catch {
    // Media remains optional when the server-only service credential is unavailable.
  }
  return urls;
}
