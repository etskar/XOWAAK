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
import { commonMessages as esCommon } from "./es/common";
import { errorMessages as esErrors } from "./es/errors";
import { navigationMessages as esNavigation } from "./es/navigation";
import { socialMessages as esSocial } from "./es/social";
import { postsMessages as esPosts } from "./es/posts";
import { commonMessages as frCommon } from "./fr/common";
import { errorMessages as frErrors } from "./fr/errors";
import { navigationMessages as frNavigation } from "./fr/navigation";
import { socialMessages as frSocial } from "./fr/social";
import { postsMessages as frPosts } from "./fr/posts";
import { commonMessages as deCommon } from "./de/common";
import { errorMessages as deErrors } from "./de/errors";
import { navigationMessages as deNavigation } from "./de/navigation";
import { socialMessages as deSocial } from "./de/social";
import { postsMessages as dePosts } from "./de/posts";
import { commonMessages as trCommon } from "./tr/common";
import { errorMessages as trErrors } from "./tr/errors";
import { navigationMessages as trNavigation } from "./tr/navigation";
import { socialMessages as trSocial } from "./tr/social";
import { postsMessages as trPosts } from "./tr/posts";
import { commonMessages as ptCommon } from "./pt/common";
import { errorMessages as ptErrors } from "./pt/errors";
import { navigationMessages as ptNavigation } from "./pt/navigation";
import { socialMessages as ptSocial } from "./pt/social";
import { postsMessages as ptPosts } from "./pt/posts";
import { commonMessages as zhCommon } from "./zh/common";
import { errorMessages as zhErrors } from "./zh/errors";
import { navigationMessages as zhNavigation } from "./zh/navigation";
import { socialMessages as zhSocial } from "./zh/social";
import { postsMessages as zhPosts } from "./zh/posts";
import { landingMessages } from "@/i18n/landing-messages";
import { authMessages } from "@/i18n/auth-messages";
import { identityMessages } from "@/i18n/identity-messages";

export const messages = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    identity: enIdentity,
    errors: enErrors,
    social: enSocial,
    posts: enPosts,
    landing: landingMessages.en,
  },
  ar: {
    common: arCommon,
    navigation: arNavigation,
    auth: arAuth,
    identity: arIdentity,
    errors: arErrors,
    social: arSocial,
    posts: arPosts,
    landing: landingMessages.ar,
  },
  es: {
    common: esCommon,
    navigation: esNavigation,
    auth: authMessages.es,
    identity: identityMessages.es,
    errors: esErrors,
    social: esSocial,
    posts: esPosts,
    landing: landingMessages.es,
  },
  fr: {
    common: frCommon,
    navigation: frNavigation,
    auth: authMessages.fr,
    identity: identityMessages.fr,
    errors: frErrors,
    social: frSocial,
    posts: frPosts,
    landing: landingMessages.fr,
  },
  de: {
    common: deCommon,
    navigation: deNavigation,
    auth: authMessages.de,
    identity: identityMessages.de,
    errors: deErrors,
    social: deSocial,
    posts: dePosts,
    landing: landingMessages.de,
  },
  tr: {
    common: trCommon,
    navigation: trNavigation,
    auth: authMessages.tr,
    identity: identityMessages.tr,
    errors: trErrors,
    social: trSocial,
    posts: trPosts,
    landing: landingMessages.tr,
  },
  pt: {
    common: ptCommon,
    navigation: ptNavigation,
    auth: authMessages.pt,
    identity: identityMessages.pt,
    errors: ptErrors,
    social: ptSocial,
    posts: ptPosts,
    landing: landingMessages.pt,
  },
  zh: {
    common: zhCommon,
    navigation: zhNavigation,
    auth: authMessages.zh,
    identity: identityMessages.zh,
    errors: zhErrors,
    social: zhSocial,
    posts: zhPosts,
    landing: landingMessages.zh,
  },
} as const;

export type Messages = (typeof messages)[keyof typeof messages];
