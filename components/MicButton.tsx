'use client';

import type { CaptureMode, CaptureState } from '@/lib/useVoiceCapture';

type Props = {
  mode: CaptureMode;
  state: CaptureState;
  accent: 'dusk' | 'dawn' | 'neutral';
  onHoldStart: () => void;
  onHoldEnd: () => void;
  disabled?: boolean;
};

const LABELS: Record<CaptureState, string> = {
  idle: 'Press and hold to speak',
  armed: 'Listening for speech…',
  listening: 'Hearing you…',
  processing: 'Translating…',
  error: 'Mic unavailable',
};

export function MicButton({ mode, state, accent, onHoldStart, onHoldEnd, disabled }: Props) {
  const isActive = state === 'listening';
  const isBusy = state === 'processing';
  const glow =
    accent === 'dusk'
      ? 'shadow-[0_0_60px_-10px_#5B7FDE]'
      : accent === 'dawn'
        ? 'shadow-[0_0_60px_-10px_#E8A63C]'
        : 'shadow-[0_0_50px_-12px_#F5F1E8]';
  const bg = accent === 'dusk' ? 'bg-dusk' : accent === 'dawn' ? 'bg-dawn' : 'bg-paper';

  const handlers =
    mode === 'hold'
      ? {
          onPointerDown: (e: React.PointerEvent) => {
            e.preventDefault();
            onHoldStart();
          },
          onPointerUp: onHoldEnd,
          onPointerLeave: () => state === 'listening' && onHoldEnd(),
        }
      : {};

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-24 w-24 items-center justify-center">
        {isActive && (
          <>
            <span className={`absolute inline-flex h-full w-full animate-pulseRing rounded-full ${bg} opacity-40`} />
            <span
              className={`absolute inline-flex h-full w-full animate-pulseRing rounded-full ${bg} opacity-30 [animation-delay:0.4s]`}
            />
          </>
        )}
        <button
          type="button"
          disabled={disabled || mode === 'auto'}
          aria-pressed={isActive}
          aria-label={mode === 'auto' ? 'Auto-listening is on' : 'Hold to speak'}
          className={`focus-ring relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink-line/60 ${bg} text-ink transition-transform duration-150 ${glow} ${
            isActive ? 'scale-105' : 'scale-100'
          } ${mode === 'auto' ? 'cursor-default' : 'cursor-pointer active:scale-95'} disabled:opacity-70`}
          {...handlers}
        >
          {isBusy ? (
            <svg className="h-7 w-7 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
              <path
                d="M5 11a7 7 0 0 0 14 0M12 18v3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper-dim">{LABELS[state]}</p>
    </div>
  );
}
