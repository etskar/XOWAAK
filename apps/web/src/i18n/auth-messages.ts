import type { Locale } from "@/config/locales";

export const authMessages = {
  en: {
    common: {
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      submit: "Continue",
      loading: "Working...",
      signIn: "Sign in",
      signUp: "Create account",
      recovery: "Recover account",
      updatePassword: "Update password",
      backToSignIn: "Back to sign in",
      notConfigured: "Authentication is not configured in this environment.",
      unexpected: "Something went wrong. Please try again.",
      passwordUpdated: "Your password was updated. Please sign in again.",
    },
    signIn: {
      title: "Sign in to XOWAAK",
      description: "Use your account credentials to continue.",
      noAccount: "Do not have an account?",
      signUpLink: "Create one",
      forgotPassword: "Forgot your password?",
      success: "You are signed in.",
    },
    signUp: {
      title: "Create your XOWAAK account",
      description: "Create an account to continue.",
      alreadyHaveAccount: "Already have an account?",
      signInLink: "Sign in",
      verification: "If the address can receive mail, verification instructions will be sent.",
      success: "Check your email for verification instructions.",
    },
    recovery: {
      title: "Recover your account",
      description: "Enter your email and we will send recovery instructions when applicable.",
      success: "If this email is linked to an account, recovery instructions will be sent.",
    },
    updatePassword: {
      title: "Choose a new password",
      description: "Set a new password for your XOWAAK account.",
      success: "Your password was updated. You can sign in now.",
    },
    verification: {
      title: "Check your email",
      description: "Use the verification link sent to your email address.",
      invalid: "This verification link is invalid or expired. Request a new one if needed.",
    },
    validation: {
      emailRequired: "Enter your email.",
      emailInvalid: "Enter a valid email address.",
      passwordRequired: "Enter your password.",
      passwordMinimum: "Password must be at least 8 characters.",
      passwordMismatch: "Passwords do not match.",
    },
    errors: {
      invalidCredentials: "The email or password is incorrect.",
      emailNotConfirmed: "Verify your email before signing in.",
      emailAlreadyRegistered: "This email cannot be used for a new account.",
      sessionExpired: "Your session has expired. Please try again.",
      callback: "The authentication link could not be completed.",
      unavailable: "Authentication is temporarily unavailable. Please try again later.",
    },
  },
  ar: {
    common: {
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      submit: "متابعة",
      loading: "جارٍ التنفيذ...",
      signIn: "تسجيل الدخول",
      signUp: "إنشاء حساب",
      recovery: "استعادة الحساب",
      updatePassword: "تحديث كلمة المرور",
      backToSignIn: "العودة إلى تسجيل الدخول",
      notConfigured: "المصادقة غير مهيأة في هذه البيئة.",
      unexpected: "حدث خطأ. حاول مرة أخرى.",
      passwordUpdated: "تم تحديث كلمة المرور. سجل الدخول مرة أخرى.",
    },
    signIn: {
      title: "تسجيل الدخول إلى XOWAAK",
      description: "استخدم بيانات حسابك للمتابعة.",
      noAccount: "ليس لديك حساب؟",
      signUpLink: "أنشئ حساباً",
      forgotPassword: "هل نسيت كلمة المرور؟",
      success: "تم تسجيل الدخول.",
    },
    signUp: {
      title: "إنشاء حساب XOWAAK",
      description: "أنشئ حساباً للمتابعة.",
      alreadyHaveAccount: "لديك حساب بالفعل؟",
      signInLink: "تسجيل الدخول",
      verification: "إذا كان البريد قابلاً للاستلام، فسترسل تعليمات التحقق.",
      success: "تحقق من بريدك الإلكتروني للحصول على التعليمات.",
    },
    recovery: {
      title: "استعادة الحساب",
      description: "أدخل بريدك الإلكتروني وسنرسل تعليمات الاستعادة عند توفرها.",
      success: "إذا كان البريد مرتبطاً بحساب، فسترسل تعليمات الاستعادة.",
    },
    updatePassword: {
      title: "اختيار كلمة مرور جديدة",
      description: "عيّن كلمة مرور جديدة لحساب XOWAAK.",
      success: "تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.",
    },
    verification: {
      title: "تحقق من بريدك الإلكتروني",
      description: "استخدم رابط التحقق الذي تم إرساله إلى بريدك الإلكتروني.",
      invalid: "رابط التحقق غير صالح أو منتهي. اطلب رابطاً جديداً عند الحاجة.",
    },
    validation: {
      emailRequired: "أدخل بريدك الإلكتروني.",
      emailInvalid: "أدخل عنوان بريد إلكتروني صالحاً.",
      passwordRequired: "أدخل كلمة المرور.",
      passwordMinimum: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
      passwordMismatch: "كلمتا المرور غير متطابقتين.",
    },
    errors: {
      invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      emailNotConfirmed: "تحقق من بريدك الإلكتروني قبل تسجيل الدخول.",
      emailAlreadyRegistered: "لا يمكن استخدام هذا البريد لإنشاء حساب جديد.",
      sessionExpired: "انتهت جلستك. حاول مرة أخرى.",
      callback: "تعذر إكمال رابط المصادقة.",
      unavailable: "المصادقة غير متاحة مؤقتاً. حاول لاحقاً.",
    },
  },
} as const;

export type AuthMessages = (typeof authMessages)[Locale];

export function getAuthMessages(locale: Locale): AuthMessages {
  return authMessages[locale];
}
