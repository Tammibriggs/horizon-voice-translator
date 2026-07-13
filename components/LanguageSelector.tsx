'use client';

import { LANGUAGES } from '@/lib/languages';

type Props = {
  label: string;
  accent: 'dusk' | 'dawn';
  value: string;
  onChange: (code: string) => void;
  disabledCode?: string;
};

export function LanguageSelector({ label, accent, value, onChange, disabledCode }: Props) {
  const ring = accent === 'dusk' ? 'focus:border-dusk' : 'focus:border-dawn';
  const dot = accent === 'dusk' ? 'bg-dusk' : 'bg-dawn';

  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-paper-dim">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`focus-ring w-full appearance-none rounded-lg border border-ink-line bg-ink-soft px-4 py-3 pr-9 font-sans text-sm text-paper transition-colors ${ring}`}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code} disabled={lang.code === disabledCode}>
              {lang.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-paper-dim"
          viewBox="0 0 12 8"
          fill="none"
        >
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </label>
  );
}
