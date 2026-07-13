export type Language = {
  code: string;
  label: string;
  /** BCP-47-ish hint passed to Gemini so it knows exactly what to translate to. */
  hint: string;
};

export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', hint: 'English' },
  { code: 'es', label: 'Spanish', hint: 'Spanish' },
  { code: 'fr', label: 'French', hint: 'French' },
  { code: 'de', label: 'German', hint: 'German' },
  { code: 'it', label: 'Italian', hint: 'Italian' },
  { code: 'pt', label: 'Portuguese', hint: 'Portuguese' },
  { code: 'ja', label: 'Japanese', hint: 'Japanese' },
  { code: 'ko', label: 'Korean', hint: 'Korean' },
  { code: 'zh', label: 'Mandarin Chinese', hint: 'Mandarin Chinese' },
  { code: 'ar', label: 'Arabic', hint: 'Modern Standard Arabic' },
  { code: 'hi', label: 'Hindi', hint: 'Hindi' },
  { code: 'ru', label: 'Russian', hint: 'Russian' },
  { code: 'nl', label: 'Dutch', hint: 'Dutch' },
  { code: 'tr', label: 'Turkish', hint: 'Turkish' },
  { code: 'sw', label: 'Swahili', hint: 'Swahili' },
  { code: 'yo', label: 'Yoruba', hint: 'Yoruba' },
  { code: 'ig', label: 'Igbo', hint: 'Igbo' },
  { code: 'ha', label: 'Hausa', hint: 'Hausa' },
];

export function languageByCode(code: string): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
