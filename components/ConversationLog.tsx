'use client';

import type { Turn } from '@/lib/types';

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatusPill({ turn }: { turn: Turn }) {
  if (turn.status === 'error') {
    return <span className="font-mono text-[10px] uppercase tracking-widest text-red-400">Couldn&rsquo;t translate</span>;
  }
  if (turn.status !== 'done') {
    return (
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-paper-dim">
        <span className="h-1 w-1 animate-pulse rounded-full bg-current" />
        {turn.status === 'translating' ? 'translating' : 'speaking'}
      </span>
    );
  }
  return null;
}

export function ConversationLog({ turns, onReplay }: { turns: Turn[]; onReplay: (turn: Turn) => void }) {
  if (turns.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="font-display text-lg italic text-paper-dim">The horizon is quiet.</p>
        <p className="max-w-xs font-sans text-sm text-paper-dim/70">
          Speak, and what you say will cross over, translated, to the other shore.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-6">
      {turns.map((turn) => {
        const isSource = turn.side === 'source';
        return (
          <div key={turn.id} className={`flex ${isSource ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[82%] rounded-2xl border px-4 py-3 sm:max-w-[65%] ${isSource ? 'border-dusk-dim/50 bg-dusk-dim/10' : 'border-dawn-dim/50 bg-dawn-dim/10'
                }`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-4">
                <span
                  className={`font-mono text-[10px] uppercase tracking-[0.16em] ${isSource ? 'text-dusk-glow' : 'text-dawn-glow'
                    }`}
                >
                  {turn.detectedLanguage ?? '…'}
                </span>
                <span className="font-mono text-[10px] text-paper-dim">{timeLabel(turn.createdAt)}</span>
              </div>

              {turn.sourceText && <p className="font-sans text-sm text-paper/80">{turn.sourceText}</p>}

              {turn.translatedText && (
                <p className="mt-1.5 font-display text-base italic leading-snug text-paper">
                  {turn.translatedText}
                </p>
              )}

              {turn.error && <p className="font-sans text-sm text-red-400 break-words">{turn.error}</p>}

              <div className="mt-2 flex items-center justify-between">
                <StatusPill turn={turn} />
                {turn.audioUrl && (
                  <button
                    type="button"
                    onClick={() => onReplay(turn)}
                    className="focus-ring flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-paper-dim transition-colors hover:text-paper"
                  >
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
                      <path d="M4 2.5v11l10-5.5-10-5.5z" />
                    </svg>
                    Replay
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
