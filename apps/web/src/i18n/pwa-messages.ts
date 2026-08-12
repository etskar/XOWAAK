import type { Locale } from "@/config/locales";

export const pwaMessages = {
  en: {
    install: "Install XOWAAK",
    installed: "XOWAAK is installed",
    iosTitle: "Add XOWAAK to your Home Screen",
    iosDescription: "Open the browser Share menu, then choose Add to Home Screen.",
    close: "Close",
  },
  ar: {
    install: "تثبيت XOWAAK",
    installed: "تم تثبيت XOWAAK",
    iosTitle: "أضف XOWAAK إلى الشاشة الرئيسية",
    iosDescription: "افتح قائمة المشاركة في المتصفح ثم اختر إضافة إلى الشاشة الرئيسية.",
    close: "إغلاق",
  },
  es: {
    install: "Instalar XOWAAK",
    installed: "XOWAAK está instalada",
    iosTitle: "Añade XOWAAK a tu pantalla de inicio",
    iosDescription: "Abre el menú Compartir del navegador y elige Añadir a pantalla de inicio.",
    close: "Cerrar",
  },
  fr: {
    install: "Installer XOWAAK",
    installed: "XOWAAK est installée",
    iosTitle: "Ajouter XOWAAK à l’écran d’accueil",
    iosDescription: "Ouvrez le menu Partager du navigateur, puis choisissez Sur l’écran d’accueil.",
    close: "Fermer",
  },
  de: {
    install: "XOWAAK installieren",
    installed: "XOWAAK ist installiert",
    iosTitle: "XOWAAK zum Home-Bildschirm hinzufügen",
    iosDescription: "Öffne das Teilen-Menü des Browsers und wähle Zum Home-Bildschirm.",
    close: "Schließen",
  },
  tr: {
    install: "XOWAAK'ı yükle",
    installed: "XOWAAK yüklendi",
    iosTitle: "XOWAAK'ı ana ekrana ekle",
    iosDescription: "Tarayıcıdaki Paylaş menüsünü aç ve Ana Ekrana Ekle seçeneğini kullan.",
    close: "Kapat",
  },
  pt: {
    install: "Instalar XOWAAK",
    installed: "XOWAAK está instalada",
    iosTitle: "Adicionar XOWAAK à tela inicial",
    iosDescription: "Abra o menu Compartilhar do navegador e escolha Adicionar à Tela de Início.",
    close: "Fechar",
  },
  zh: {
    install: "安装 XOWAAK",
    installed: "XOWAAK 已安装",
    iosTitle: "将 XOWAAK 添加到主屏幕",
    iosDescription: "打开浏览器的分享菜单，然后选择添加到主屏幕。",
    close: "关闭",
  },
} as const;

export type PwaMessages = (typeof pwaMessages)[Locale];

export function getPwaMessages(locale: Locale): PwaMessages {
  return pwaMessages[locale];
}
