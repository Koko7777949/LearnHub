"use client";

import React, { createContext, useContext } from "react";

import { en } from "./locales/en";
import { zh } from "./locales/zh";
import { ar } from "./locales/ar";
import { fr } from "./locales/fr";
import { es } from "./locales/es";
import { de } from "./locales/de";
import { pt } from "./locales/pt";
import { ru } from "./locales/ru";
import { ja } from "./locales/ja";
import { ko } from "./locales/ko";
import { tr } from "./locales/tr";
import { hi } from "./locales/hi";

export type Lang = "en" | "zh" | "ar" | "fr" | "es" | "de" | "pt" | "ru" | "ja" | "ko" | "tr" | "hi";

export type { DictKey } from "./locales/en";

/** Metadata for every supported interface language. */
export interface LanguageMeta {
  code: Lang;
  /** name in the language itself, shown in the switcher */
  native: string;
  /** name in English (for a11y labels) */
  english: string;
  flag: string;
  dir: "ltr" | "rtl";
  /** BCP-47 locale used for Intl date/number formatting */
  locale: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: "en", native: "English", english: "English", flag: "🇺🇸", dir: "ltr", locale: "en-US" },
  { code: "zh", native: "中文", english: "Chinese", flag: "🇨🇳", dir: "ltr", locale: "zh-CN" },
  { code: "ar", native: "العربية", english: "Arabic", flag: "🇸🇦", dir: "rtl", locale: "ar-EG" },
  { code: "fr", native: "Français", english: "French", flag: "🇫🇷", dir: "ltr", locale: "fr-FR" },
  { code: "es", native: "Español", english: "Spanish", flag: "🇪🇸", dir: "ltr", locale: "es-ES" },
  { code: "de", native: "Deutsch", english: "German", flag: "🇩🇪", dir: "ltr", locale: "de-DE" },
  { code: "pt", native: "Português", english: "Portuguese", flag: "🇧🇷", dir: "ltr", locale: "pt-BR" },
  { code: "ru", native: "Русский", english: "Russian", flag: "🇷🇺", dir: "ltr", locale: "ru-RU" },
  { code: "ja", native: "日本語", english: "Japanese", flag: "🇯🇵", dir: "ltr", locale: "ja-JP" },
  { code: "ko", native: "한국어", english: "Korean", flag: "🇰🇷", dir: "ltr", locale: "ko-KR" },
  { code: "tr", native: "Türkçe", english: "Turkish", flag: "🇹🇷", dir: "ltr", locale: "tr-TR" },
  { code: "hi", native: "हिन्दी", english: "Hindi", flag: "🇮🇳", dir: "ltr", locale: "hi-IN" },
];

const LANG_MAP: Record<Lang, LanguageMeta> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l]),
) as Record<Lang, LanguageMeta>;

/** Resolve unknown/stored codes gracefully (e.g. older persisted state). */
export function normalizeLang(value: string | null | undefined): Lang {
  return LANG_MAP[(value ?? "") as Lang]?.code ?? "en";
}

export function langMeta(lang: Lang): LanguageMeta {
  return LANG_MAP[lang] ?? LANG_MAP.en;
}

export function isRTL(lang: Lang): boolean {
  return langMeta(lang).dir === "rtl";
}

/** BCP-47 locale for Intl formatting (dates, numbers). */
export function localeOf(lang: Lang): string {
  return langMeta(lang).locale;
}

const locales: Record<Lang, Record<string, string>> = { en, zh, ar, fr, es, de, pt, ru, ja, ko, tr, hi };

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({
  lang,
  setLang,
  children,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  children: React.ReactNode;
}) {
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangContext);
  const t = (key: string) => locales[ctx.lang]?.[key] ?? en[key] ?? key;
  return { t, lang: ctx.lang, setLang: ctx.setLang };
}

// category / level / status translation helpers
export function trCategory(cat: string, lang: Lang) {
  const map: Record<string, string> = {
    Development: "catDevelopment",
    Business: "catBusiness",
    Design: "catDesign",
    "Data Science": "catDataScience",
    Marketing: "catMarketing",
    "IT & Software": "catIT",
  };
  const key = map[cat];
  return key ? locales[lang]?.[key] ?? en[key] : cat;
}

export function trLevel(level: string, lang: Lang) {
  const map: Record<string, string> = {
    BEGINNER: "levelBeginner",
    INTERMEDIATE: "levelIntermediate",
    ADVANCED: "levelAdvanced",
  };
  const key = map[level];
  return key ? locales[lang]?.[key] ?? en[key] : level;
}
