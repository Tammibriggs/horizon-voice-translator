'use client';

import { useEffect, useRef } from 'react';

export type WaveformPhase = 'idle' | 'listening' | 'translating' | 'speaking';

type Props = {
  analyser: AnalyserNode | null;
  phase: WaveformPhase;
  /** Which shore this activity belongs to — drives the color mix. 'neutral' before a speaker is identified. */
  side: 'source' | 'target' | 'neutral';
};

const DUSK = [91, 127, 222]; // #5B7FDE
const DAWN = [232, 166, 60]; // #E8A63C

function mix(a: number[], b: number[], t: number) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

export function Waveform({ analyser, phase, side }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const bufferLength = analyser?.frequencyBinCount ?? 64;
    const dataArray = new Uint8Array(bufferLength);

    const bars = 48;
    const colorTarget = side === 'source' ? DUSK : side === 'target' ? DAWN : mix(DUSK, DAWN, 0.5);
    const colorBase = mix(DUSK, DAWN, 0.5);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      if (analyser && (phase === 'listening' || phase === 'speaking')) {
        analyser.getByteFrequencyData(dataArray);
      }

      const midY = h / 2;
      const gap = w / bars;
      tRef.current += phase === 'idle' ? 0.02 : 0.06;

      const intensity = phase === 'idle' ? 0.12 : phase === 'translating' ? 0.35 : 1;
      const colorT = phase === 'idle' ? 0.5 : 0.85;
      const color = mix(colorBase, colorTarget, colorT);

      for (let i = 0; i < bars; i++) {
        let amp: number;
        if (analyser && (phase === 'listening' || phase === 'speaking')) {
          const idx = Math.floor((i / bars) * bufferLength);
          amp = (dataArray[idx] / 255) * 0.85 + 0.05;
        } else if (phase === 'translating') {
          amp = 0.25 + 0.25 * Math.abs(Math.sin(tRef.current * 2 + i * 0.5));
        } else if (phase === 'listening') {
          amp = 0.35 + 0.45 * Math.abs(Math.sin(tRef.current * 3 + i * 0.7));
        } else {
          amp = 0.08 + 0.06 * Math.abs(Math.sin(tRef.current + i * 0.35));
        }
        amp *= intensity + (1 - intensity) * 0.4;

        const barH = Math.max(2, amp * h * 0.9);
        const x = i * gap + gap * 0.28;
        const bw = gap * 0.44;
        const alpha = 0.35 + 0.65 * amp;

        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
        ctx.beginPath();
        const radius = Math.min(bw / 2, 3);
        const y = midY - barH / 2;
        ctx.roundRect(x, y, bw, barH, radius);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, phase, side]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />;
}
