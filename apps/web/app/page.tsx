import { redirect } from "next/navigation";

import { hasSupabasePublicEnv } from "@/config/public-env";
import { getCurrentUser } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  if (hasSupabasePublicEnv()) {
    const user = await getCurrentUser();
    if (user) redirect("/en/home");
  }

  redirect("/en");
}
