'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LanguageSelector } from '@/components/LanguageSelector';
import { MicButton } from '@/components/MicButton';
import { Waveform, type WaveformPhase } from '@/components/Waveform';
import { ConversationLog } from '@/components/ConversationLog';
import { useVoiceCapture } from '@/lib/useVoiceCapture';
import { languageByCode } from '@/lib/languages';
import type { Turn } from '@/lib/types';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function VoiceStage() {
  const [shoreALang, setShoreALang] = useState('en');
  const [shoreBLang, setShoreBLang] = useState('es');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [phase, setPhase] = useState<WaveformPhase>('idle');
  // Which shore last spoke — only known *after* a clip comes back from Gemini.
  // Drives the mic/waveform accent for the "speaking" (playback) phase; while
  // listening/translating the UI stays neutral since we don't know yet.
  const [lastSide, setLastSide] = useState<'source' | 'target' | null>(null);

  const shoreALangRef = useRef(shoreALang);
  const shoreBLangRef = useRef(shoreBLang);
  shoreALangRef.current = shoreALang;
  shoreBLangRef.current = shoreBLang;

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyserReady, setAnalyserReady] = useState(false);

  // Lazily wire an AnalyserNode to the shared <audio> element for the
  // waveform's "speaking" visualization — must happen after user gesture.
  const ensureAudioGraph = useCallback(() => {
    if (audioCtxRef.current || !audioElRef.current) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const source = ctx.createMediaElementSource(audioElRef.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    setAnalyserReady(true);
  }, []);

  const updateTurn = useCallback((id: string, patch: Partial<Turn>) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const speak = useCallback(
    async (turnId: string, text: string) => {
      try {
        setPhase('speaking');
        const res = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Speech synthesis failed (${res.status}).`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        updateTurn(turnId, { audioUrl: url, status: 'done' });

        ensureAudioGraph();
        if (audioElRef.current) {
          audioElRef.current.src = url;
          await audioElRef.current.play().catch(() => {});
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Speech synthesis failed.';
        updateTurn(turnId, { status: 'error', error: message });
      } finally {
        setPhase('idle');
      }
    },
    [ensureAudioGraph, updateTurn],
  );

  const handleClip = useCallback(
    async (blob: Blob) => {
      const turnId = uid();
      // Side isn't known yet — the log entry starts neutral and gets placed
      // once Gemini reports which shore actually spoke.
      setTurns((prev) => [
        ...prev,
        { id: turnId, createdAt: Date.now(), status: 'translating', side: 'source' },
      ]);
      setPhase('translating');
      setNotice(null);

      try {
        const form = new FormData();
        form.append('audio', blob, 'clip.wav');
        form.append('langA', shoreALangRef.current);
        form.append('langB', shoreBLangRef.current);

        const res = await fetch('/api/translate', { method: 'POST', body: form });
        const body = await res.json();

        if (!res.ok) {
          throw new Error(body.error ?? `Translation failed (${res.status}).`);
        }

        const side: 'source' | 'target' = body.spokenSide === 'B' ? 'target' : 'source';
        setLastSide(side);

        updateTurn(turnId, {
          side,
          detectedLanguage: body.detectedLanguage,
          sourceText: body.sourceText,
          translatedText: body.translatedText,
          status: 'speaking',
        });

        await speak(turnId, body.translatedText);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        updateTurn(turnId, { status: 'error', error: message });
        setPhase('idle');
      }
    },
    [speak, updateTurn],
  );

  const capture = useVoiceCapture({
    onClip: handleClip,
    onError: (msg) => setNotice(msg),
  });

  useEffect(() => {
    if (capture.state === 'listening') setPhase('listening');
    else if (capture.state === 'processing') setPhase('translating');
    else if (phase !== 'speaking' && phase !== 'translating') setPhase('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture.state]);

  const replay = useCallback(
    (turn: Turn) => {
      if (!turn.audioUrl) return;
      ensureAudioGraph();
      if (audioElRef.current) {
        audioElRef.current.src = turn.audioUrl;
        audioElRef.current.play().catch(() => {});
      }
    },
    [ensureAudioGraph],
  );

  // Neutral while listening/translating (we don't know who's speaking yet);
  // colored to match the last identified speaker only while audio plays back.
  const waveSide = phase === 'speaking' && lastSide ? lastSide : 'neutral';
  const micAccent = phase === 'speaking' && lastSide ? (lastSide === 'source' ? 'dusk' : 'dawn') : 'neutral';

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 pb-8 pt-6 sm:px-8">
      <audio ref={audioElRef} className="hidden" crossOrigin="anonymous" />

      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-paper-dim">
          <span className="h-1.5 w-1.5 rounded-full bg-dusk" />
          Horizon
        </div>
        <h1 className="font-display text-3xl italic tracking-tight text-paper sm:text-4xl">
          Say it on one shore, <span className="not-italic text-dawn-glow">hear it on the other.</span>
        </h1>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <LanguageSelector label="Shore A" accent="dusk" value={shoreALang} onChange={setShoreALang} disabledCode={shoreBLang} />
        <LanguageSelector label="Shore B" accent="dawn" value={shoreBLang} onChange={setShoreBLang} disabledCode={shoreALang} />
      </section>

      <section className="flex flex-col items-center gap-6 rounded-3xl border border-ink-line bg-ink-soft/60 px-6 py-8">
        <div className="h-24 w-full max-w-md">
          <Waveform analyser={analyserReady ? analyserRef.current : null} phase={phase} side={waveSide} />
        </div>

        <MicButton
          mode={capture.mode}
          state={capture.state}
          accent={micAccent}
          onHoldStart={capture.startHold}
          onHoldEnd={capture.stopHold}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-sans text-sm text-paper-dim">
            {capture.mode === 'auto'
              ? `Listening automatically — speak either ${languageByCode(shoreALang).label} or ${languageByCode(shoreBLang).label}, Horizon detects which and translates into the other.`
              : `Hold the mic and speak either ${languageByCode(shoreALang).label} or ${languageByCode(shoreBLang).label} — Horizon detects which and translates into the other.`}
          </p>
          <button
            type="button"
            onClick={capture.toggleMode}
            className="focus-ring font-mono text-[11px] uppercase tracking-widest text-paper-dim underline decoration-dotted underline-offset-4 hover:text-paper"
          >
            Switch to {capture.mode === 'auto' ? 'hold-to-talk' : 'auto-listen'}
          </button>
        </div>

        {notice && (
          <p className="rounded-lg border border-dawn-dim/50 bg-dawn-dim/10 px-3 py-2 font-sans text-xs text-dawn-glow">
            {notice}
          </p>
        )}
      </section>

      <ConversationLog turns={turns} onReplay={replay} />
    </div>
  );
}
