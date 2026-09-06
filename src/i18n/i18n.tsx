"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const LANGS = [
  { code: "en", short: "EN", name: "English", dir: "ltr" },
  { code: "ar", short: "ع", name: "العربية", dir: "rtl" },
  { code: "es", short: "ES", name: "Español", dir: "ltr" },
  { code: "ko", short: "KO", name: "한국어", dir: "ltr" },
  { code: "ja", short: "JA", name: "日本語", dir: "ltr" },
] as const;

export type LangCode = (typeof LANGS)[number]["code"];

const STORAGE_KEY = "uplink_lang";

type Dict = Record<string, string>;

const en: Dict = {
  /* navbar */
  nav_home: "Home",
  nav_club: "CLUB",
  nav_uplink: "Uplink",
  nav_backHome: "Back to Home",
  nav_dm: "DM",
  nav_dmTitle: "Direct Messages",
  nav_dmCover: "No Direct Messages",
  nav_autoApply: "Auto-Apply",
  nav_autoOn: "Auto ON",
  nav_autoOff: "Auto OFF",
  nav_locked: "LOCKED",
  nav_inOffer: "IN OFFER",
  nav_dark: "Dark",
  nav_light: "Light",
  nav_themeTitle: "Toggle Theme",
  nav_alerts: "Alerts",
  nav_noAlerts: "No alerts",
  nav_clearAll: "CLEAR ALL",
  nav_access: "ACCESS TERMINAL",
  nav_myProfile: "MY PROFILE",
  nav_operative: "Operative",
  nav_moveTitle: "Apply",
  nav_language: "Language",
  nav_motionPause: "Pause background motion",
  nav_motionPlay: "Play background motion",
  /* homepage hero */
  hero_crew: "Find Your Crew",
  hero_tagline: "DUNGEONS · RAIDS · LEVELING",
  hero_adventure: "Find trusted players for your next adventure.",
  hero_create: "Create Your Offer",
  /* tabs */
  tab_dungeons: "DUNGEONS",
  tab_leveling: "LEVELING",
  tab_boosts: "BOOSTS",
  tab_pvp: "PVP",
  /* dock */
  dock_chat: "CHAT",
  dock_quests: "QUESTS",
  dock_favorites: "FAVORITES",
  /* offers */
  offers_header: "Available Offers",
  offers_online: "New Offers Online",
  offers_empty: "No matching offers found",
  offer_dungeonboost: "DUNGEON BOOST",
  offer_leveling: "LEVELING 1-80",
  reward_25k: "25K PER RUN",
  reward_50k: "50K PER RUN",
  players_meta: "4 × +10",
  /* missions */
  missions_header: "Ongoing Missions",
  missions_empty: "No Active Missions",
};

const ar: Dict = {
  nav_home: "الرئيسية",
  nav_club: "النادي",
  nav_uplink: "أبلينك",
  nav_backHome: "رجوع للرئيسية",
  nav_dm: "رسائل",
  nav_dmTitle: "الرسائل المباشرة",
  nav_dmCover: "لا توجد رسائل",
  nav_autoApply: "تطبيق تلقائي",
  nav_autoOn: "تلقائي يعمل",
  nav_autoOff: "تلقائي متوقف",
  nav_locked: "مقفل",
  nav_inOffer: "داخل عرض",
  nav_dark: "داكن",
  nav_light: "فاتح",
  nav_themeTitle: "بدّل المظهر",
  nav_alerts: "التنبيهات",
  nav_noAlerts: "لا تنبيهات",
  nav_clearAll: "مسح الكل",
  nav_access: "دخول البوابة",
  nav_myProfile: "ملفي",
  nav_operative: "عميل",
  nav_moveTitle: "تطبيق",
  nav_language: "اللغة",
  nav_motionPause: "إيقاف حركة الخلفية",
  nav_motionPlay: "تشغيل حركة الخلفية",
  hero_crew: "اعثر على فريقك",
  hero_tagline: "دانجنز · رايدز · ليفلينج",
  hero_adventure: "اعثر على لاعبين موثوقين لمغامرتك القادمة.",
  hero_create: "أنشئ عرضك",
  tab_dungeons: "الدانجنز",
  tab_leveling: "رفع المستوى",
  tab_boosts: "البوستات",
  tab_pvp: "PVP",
  dock_chat: "الشات",
  dock_quests: "المهام",
  dock_favorites: "المفضلة",
  offers_header: "العروض المتاحة",
  offers_online: "عروض جديدة أونلاين",
  offers_empty: "لم يتم العثور على عروض مطابقة",
  offer_dungeonboost: "بوست دانجنز",
  offer_leveling: "رفع مستوى 1-80",
  reward_25k: "25 ألف للمحاولة",
  reward_50k: "50 ألف للمحاولة",
  players_meta: "4 × +10",
  missions_header: "مهام جارية",
  missions_empty: "لا توجد مهام نشطة",
};

const es: Dict = {
  nav_home: "Inicio",
  nav_club: "CLUB",
  nav_uplink: "Uplink",
  nav_backHome: "Volver al inicio",
  nav_dm: "MD",
  nav_dmTitle: "Mensajes directos",
  nav_dmCover: "Sin mensajes",
  nav_autoApply: "Auto-Aplicar",
  nav_autoOn: "AUTO ON",
  nav_autoOff: "AUTO OFF",
  nav_locked: "BLOQUEADO",
  nav_inOffer: "EN OFERTA",
  nav_dark: "Oscuro",
  nav_light: "Claro",
  nav_themeTitle: "Cambiar tema",
  nav_alerts: "Alertas",
  nav_noAlerts: "Sin alertas",
  nav_clearAll: "BORRAR TODO",
  nav_access: "ACCEDER",
  nav_myProfile: "MI PERFIL",
  nav_operative: "Operativo",
  nav_moveTitle: "Aplicar",
  nav_language: "Idioma",
  nav_motionPause: "Pausar movimiento de fondo",
  nav_motionPlay: "Reproducir movimiento de fondo",
  hero_crew: "Encuentra tu equipo",
  hero_tagline: "MAZMORRAS · INCURSIONES · NIVELEO",
  hero_adventure: "Encuentra jugadores de confianza para tu próxima aventura.",
  hero_create: "Crea tu oferta",
  tab_dungeons: "MAZMORRAS",
  tab_leveling: "NIVELEO",
  tab_boosts: "BOOSTS",
  tab_pvp: "PVP",
  dock_chat: "CHAT",
  dock_quests: "MISIONES",
  dock_favorites: "FAVORITOS",
  offers_header: "Ofertas disponibles",
  offers_online: "Nuevas ofertas en línea",
  offers_empty: "No se encontraron ofertas",
  offer_dungeonboost: "BOOST DE MAZMORRA",
  offer_leveling: "NIVEL 1-80",
  reward_25k: "25K POR INTENTO",
  reward_50k: "50K POR INTENTO",
  players_meta: "4 × +10",
  missions_header: "Misiones en curso",
  missions_empty: "Sin misiones activas",
};

const ko: Dict = {
  nav_home: "홈",
  nav_club: "클럽",
  nav_uplink: "업링크",
  nav_backHome: "홈으로",
  nav_dm: "쪽지",
  nav_dmTitle: "쪽지",
  nav_dmCover: "새 쪽지 없음",
  nav_autoApply: "자동 지원",
  nav_autoOn: "자동 ON",
  nav_autoOff: "자동 OFF",
  nav_locked: "잠김",
  nav_inOffer: "오퍼 중",
  nav_dark: "다크",
  nav_light: "라이트",
  nav_themeTitle: "테마 전환",
  nav_alerts: "알림",
  nav_noAlerts: "알림 없음",
  nav_clearAll: "모두 지우기",
  nav_access: "접속",
  nav_myProfile: "내 프로필",
  nav_operative: "요원",
  nav_moveTitle: "적용",
  nav_language: "언어",
  nav_motionPause: "배경 움직임 일시정지",
  nav_motionPlay: "배경 움직임 재생",
  hero_crew: "크루를 찾아보세요",
  hero_tagline: "던전 · 레이드 · 레벨링",
  hero_adventure: "다음 모험을 위한 믿을 수 있는 플레이어를 찾으세요.",
  hero_create: "오퍼 만들기",
  tab_dungeons: "던전",
  tab_leveling: "레벨링",
  tab_boosts: "부스트",
  tab_pvp: "PVP",
  dock_chat: "채팅",
  dock_quests: "퀘스트",
  dock_favorites: "즐겨찾기",
  offers_header: "이용 가능한 오퍼",
  offers_online: "새 오퍼 온라인",
  offers_empty: "일치하는 오퍼가 없습니다",
  offer_dungeonboost: "던전 부스트",
  offer_leveling: "레벨링 1-80",
  reward_25k: "시도당 25K",
  reward_50k: "시도당 50K",
  players_meta: "4 × +10",
  missions_header: "진행 중인 미션",
  missions_empty: "활성 미션이 없습니다",
};

const ja: Dict = {
  nav_home: "ホーム",
  nav_club: "クラブ",
  nav_uplink: "アップリンク",
  nav_backHome: "ホームへ戻る",
  nav_dm: "DM",
  nav_dmTitle: "ダイレクトメッセージ",
  nav_dmCover: "新着メッセージなし",
  nav_autoApply: "自動申請",
  nav_autoOn: "自動ON",
  nav_autoOff: "自動OFF",
  nav_locked: "ロック中",
  nav_inOffer: "オファー中",
  nav_dark: "ダーク",
  nav_light: "ライト",
  nav_themeTitle: "テーマ切替",
  nav_alerts: "アラート",
  nav_noAlerts: "アラートなし",
  nav_clearAll: "すべて消去",
  nav_access: "アクセス",
  nav_myProfile: "マイプロフィール",
  nav_operative: "オペレーティブ",
  nav_moveTitle: "適用",
  nav_language: "言語",
  nav_motionPause: "背景の動きを停止",
  nav_motionPlay: "背景の動きを再生",
  hero_crew: "仲間を見つけよう",
  hero_tagline: "ダンジョン · レイド · レベル上げ",
  hero_adventure: "次の冒険にぴったりの頼れるプレイヤーを見つけよう。",
  hero_create: "オファーを作成",
  tab_dungeons: "ダンジョン",
  tab_leveling: "レベル上げ",
  tab_boosts: "ブースト",
  tab_pvp: "PVP",
  dock_chat: "チャット",
  dock_quests: "クエスト",
  dock_favorites: "お気に入り",
  offers_header: "利用可能なオファー",
  offers_online: "新しいオファーがオンライン",
  offers_empty: "一致するオファーはありません",
  offer_dungeonboost: "ダンジョンブースト",
  offer_leveling: "レベル 1-80",
  reward_25k: "1回25K",
  reward_50k: "1回50K",
  players_meta: "4 × +10",
  missions_header: "進行中のミッション",
  missions_empty: "アクティブなミッションはありません",
};

const DICTS: Record<LangCode, Dict> = { en, ar, es, ko, ja };

const readSavedLang = (): LangCode => {
  if (typeof window === "undefined") return "en";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return (LANGS as readonly { code: LangCode }[]).some((l) => l.code === v) ? (v as LangCode) : "en";
};

const emitLangChange = () => window.dispatchEvent(new Event("uplink-lang-change"));

export function setLanguage(code: LangCode) {
  window.localStorage.setItem(STORAGE_KEY, code);
  document.documentElement.lang = code;
  document.documentElement.dir = (LANGS.find((l) => l.code === code)?.dir || "ltr");
  emitLangChange();
}

interface I18nContextValue {
  lang: LangCode;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({ lang: "en", t: (k) => en[k] ?? k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangCode>("en");

  useEffect(() => {
    setLang(readSavedLang());
    const apply = () => setLang(readSavedLang());
    window.addEventListener("uplink-lang-change", apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener("uplink-lang-change", apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = (LANGS.find((l) => l.code === lang)?.dir || "ltr");
  }, [lang]);

  const t = (key: string) => {
    const dict = DICTS[lang] || en;
    return dict[key] || en[key] || key;
  };

  return <I18nContext.Provider value={{ lang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}