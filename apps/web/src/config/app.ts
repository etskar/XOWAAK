import { defaultLocale, getDirection, locales } from "@/config/locales";
import { publicEnv } from "@/config/public-env";

export const appConfig = {
  name: publicEnv.NEXT_PUBLIC_APP_NAME,
  defaultLocale,
  locales,
  getDirection,
} as const;
