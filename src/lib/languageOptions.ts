import type { TargetLanguage } from "../types";

export type LanguagePickerSection = {
  id: string;
  title?: string;
  items: TargetLanguage[];
};

export const DEFAULT_LANGUAGE: TargetLanguage = {
  code: "zh-CN",
  label: "Chinese (Simplified)",
};

export const LANGUAGE_PRESETS: TargetLanguage[] = [
  { label: "Afrikaans", code: "af" },
  { label: "Albanian", code: "sq" },
  { label: "Amharic", code: "am" },
  { label: "Arabic", code: "ar" },
  { label: "Armenian", code: "hy" },
  { label: "Assamese", code: "as" },
  { label: "Azerbaijani", code: "az" },
  { label: "Basque", code: "eu" },
  { label: "Belarusian", code: "be" },
  { label: "Bengali", code: "bn" },
  { label: "Bosnian", code: "bs" },
  { label: "Bulgarian", code: "bg" },
  { label: "Burmese", code: "my" },
  { label: "Catalan", code: "ca" },
  { label: "Chinese (Simplified)", code: "zh-CN" },
  { label: "Chinese (Traditional)", code: "zh-TW" },
  { label: "Croatian", code: "hr" },
  { label: "Czech", code: "cs" },
  { label: "Danish", code: "da" },
  { label: "Dutch", code: "nl" },
  { label: "English", code: "en" },
  { label: "Estonian", code: "et" },
  { label: "Filipino", code: "tl" },
  { label: "Finnish", code: "fi" },
  { label: "French", code: "fr" },
  { label: "Galician", code: "gl" },
  { label: "Georgian", code: "ka" },
  { label: "German", code: "de" },
  { label: "Greek", code: "el" },
  { label: "Gujarati", code: "gu" },
  { label: "Hausa", code: "ha" },
  { label: "Hebrew", code: "he" },
  { label: "Hindi", code: "hi" },
  { label: "Hungarian", code: "hu" },
  { label: "Icelandic", code: "is" },
  { label: "Igbo", code: "ig" },
  { label: "Indonesian", code: "id" },
  { label: "Irish", code: "ga" },
  { label: "Italian", code: "it" },
  { label: "Japanese", code: "ja" },
  { label: "Javanese", code: "jv" },
  { label: "Kannada", code: "kn" },
  { label: "Kazakh", code: "kk" },
  { label: "Khmer", code: "km" },
  { label: "Korean", code: "ko" },
  { label: "Kurdish", code: "ku" },
  { label: "Kyrgyz", code: "ky" },
  { label: "Lao", code: "lo" },
  { label: "Latvian", code: "lv" },
  { label: "Lithuanian", code: "lt" },
  { label: "Luxembourgish", code: "lb" },
  { label: "Macedonian", code: "mk" },
  { label: "Malay", code: "ms" },
  { label: "Malayalam", code: "ml" },
  { label: "Maltese", code: "mt" },
  { label: "Maori", code: "mi" },
  { label: "Marathi", code: "mr" },
  { label: "Mongolian", code: "mn" },
  { label: "Nepali", code: "ne" },
  { label: "Norwegian", code: "no" },
  { label: "Odia", code: "or" },
  { label: "Pashto", code: "ps" },
  { label: "Persian", code: "fa" },
  { label: "Polish", code: "pl" },
  { label: "Portuguese", code: "pt" },
  { label: "Portuguese (Brazil)", code: "pt-BR" },
  { label: "Portuguese (Portugal)", code: "pt-PT" },
  { label: "Punjabi", code: "pa" },
  { label: "Romanian", code: "ro" },
  { label: "Russian", code: "ru" },
  { label: "Serbian (Cyrillic)", code: "sr-Cyrl" },
  { label: "Serbian (Latin)", code: "sr-Latn" },
  { label: "Sinhala", code: "si" },
  { label: "Slovak", code: "sk" },
  { label: "Slovenian", code: "sl" },
  { label: "Somali", code: "so" },
  { label: "Spanish", code: "es" },
  { label: "Spanish (Latin America)", code: "es-419" },
  { label: "Swahili", code: "sw" },
  { label: "Swedish", code: "sv" },
  { label: "Tajik", code: "tg" },
  { label: "Tamil", code: "ta" },
  { label: "Tatar", code: "tt" },
  { label: "Telugu", code: "te" },
  { label: "Thai", code: "th" },
  { label: "Turkish", code: "tr" },
  { label: "Turkmen", code: "tk" },
  { label: "Ukrainian", code: "uk" },
  { label: "Urdu", code: "ur" },
  { label: "Uzbek", code: "uz" },
  { label: "Vietnamese", code: "vi" },
  { label: "Welsh", code: "cy" },
  { label: "Xhosa", code: "xh" },
  { label: "Yiddish", code: "yi" },
  { label: "Yoruba", code: "yo" },
  { label: "Zulu", code: "zu" },
];

const COMMON_LANGUAGE_CODES = [
  "zh-CN",
  "zh-TW",
  "en",
  "ja",
  "ko",
  "es",
  "fr",
];

const LANGUAGE_LABELS = new Map(
  LANGUAGE_PRESETS.map((preset) => [preset.code, preset.label])
);

export const COMMON_LANGUAGE_PRESETS: TargetLanguage[] = COMMON_LANGUAGE_CODES.flatMap(
  (code) => {
    const label = LANGUAGE_LABELS.get(code);
    return label ? [{ code, label }] : [];
  }
);

function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeLanguageText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugifyLanguageText(value: string) {
  const normalized = normalizeLanguageText(value);
  return normalized.replace(/\s+/g, "-");
}

function matchesLanguageQuery(language: TargetLanguage, normalizedQuery: string, rawQuery: string) {
  if (!normalizedQuery) {
    return true;
  }

  return (
    normalizeLanguageText(language.label).includes(normalizedQuery) ||
    language.code.toLowerCase().includes(rawQuery.toLowerCase()) ||
    normalizeLanguageText(language.code).includes(normalizedQuery)
  );
}

export function getLanguageLabel(code: string) {
  return LANGUAGE_LABELS.get(code);
}

export function isCustomLanguage(language?: Pick<TargetLanguage, "code">) {
  return language?.code.startsWith("custom:") ?? false;
}

export function buildCustomLanguage(label: string): TargetLanguage {
  const normalizedLabel = collapseWhitespace(label);
  return {
    label: normalizedLabel,
    code: `custom:${slugifyLanguageText(normalizedLabel)}`,
  };
}

export function getCustomLanguageOption(
  query: string,
  currentLanguage?: TargetLanguage
) {
  const normalizedLabel = collapseWhitespace(query);
  if (!normalizedLabel) {
    return undefined;
  }

  const normalizedQuery = normalizeLanguageText(normalizedLabel);
  const isExactBuiltInMatch = LANGUAGE_PRESETS.some(
    (language) =>
      normalizeLanguageText(language.label) === normalizedQuery ||
      language.code.toLowerCase() === normalizedLabel.toLowerCase()
  );
  const isExactCurrentCustomMatch =
    isCustomLanguage(currentLanguage) &&
    normalizeLanguageText(currentLanguage?.label ?? "") === normalizedQuery;

  if (isExactBuiltInMatch || isExactCurrentCustomMatch) {
    return undefined;
  }

  return buildCustomLanguage(normalizedLabel);
}

export function buildLanguagePickerSections(
  query: string
): LanguagePickerSection[] {
  const rawQuery = collapseWhitespace(query);
  const normalizedQuery = normalizeLanguageText(rawQuery);
  const sections: LanguagePickerSection[] = [];

  const commonItems = COMMON_LANGUAGE_PRESETS.filter((language) =>
    matchesLanguageQuery(language, normalizedQuery, rawQuery)
  );
  const allItems = LANGUAGE_PRESETS.filter(
    (language) => matchesLanguageQuery(language, normalizedQuery, rawQuery)
  );

  if (commonItems.length > 0) {
    sections.push({
      id: "common",
      items: commonItems,
    });
  }

  if (allItems.length > 0) {
    sections.push({
      id: "all",
      title: "All languages",
      items: allItems,
    });
  }

  return sections;
}
