export type SearchLanguage = 'ar' | 'en';

const normalizeWhitespace = (value: string) =>
  value.replace(/\s+/g, ' ').trim();

export const normalizeArabicText = (value: string) => {
  const lower = value.toLowerCase();
  const withoutDiacritics = lower.replace(/[\u064B-\u0652\u0640]/g, '');
  const normalized = withoutDiacritics
    .replace(/أ|إ|آ/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
  const filtered = normalized.replace(/[^0-9\u0600-\u06ff]+/g, ' ');
  return normalizeWhitespace(filtered);
};

export const normalizeEnglishText = (value: string) => {
  const lower = value.toLowerCase();
  const filtered = lower.replace(/[^a-z0-9]+/g, ' ');
  return normalizeWhitespace(filtered);
};

export const normalizeSearchText = (
  value: string,
  language: SearchLanguage,
) => {
  if (language === 'ar') {
    return normalizeArabicText(value);
  }
  return normalizeEnglishText(value);
};

export {};
