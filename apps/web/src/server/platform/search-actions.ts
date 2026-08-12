"use server";

import { searchPlatform } from "@/server/platform/queries";

export async function searchPlatformAction(query: string) {
  return searchPlatform(query, 8);
}
