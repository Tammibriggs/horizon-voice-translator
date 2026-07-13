import { VoiceStage } from '@/components/VoiceStage';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient dusk/dawn horizon glow behind the stage */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(60% 60% at 20% 0%, #5B7FDE33 0%, transparent 60%), radial-gradient(60% 60% at 80% 0%, #E8A63C33 0%, transparent 60%)',
        }}
      />
      <VoiceStage />
      <footer className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-6 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper-dim/60">
          Speech in → Gemini interprets → ElevenLabs speaks it back, live.
        </p>
      </footer>
    </main>
  );
}
