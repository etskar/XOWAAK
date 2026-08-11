import arAuth from "./ar/auth";
import { commonMessages as arCommon } from "./ar/common";
import { errorMessages as arErrors } from "./ar/errors";
import arIdentity from "./ar/identity";
import { navigationMessages as arNavigation } from "./ar/navigation";
import { socialMessages as arSocial } from "./ar/social";
import { postsMessages as arPosts } from "./ar/posts";
import enAuth from "./en/auth";
import { commonMessages as enCommon } from "./en/common";
import { errorMessages as enErrors } from "./en/errors";
import enIdentity from "./en/identity";
import { navigationMessages as enNavigation } from "./en/navigation";
import { socialMessages as enSocial } from "./en/social";
import { postsMessages as enPosts } from "./en/posts";

export const messages = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    identity: enIdentity,
    errors: enErrors,
    social: enSocial,
    posts: enPosts,
  },
  ar: {
    common: arCommon,
    navigation: arNavigation,
    auth: arAuth,
    identity: arIdentity,
    errors: arErrors,
    social: arSocial,
    posts: arPosts,
  },
} as const;

export type Messages = (typeof messages)[keyof typeof messages];
