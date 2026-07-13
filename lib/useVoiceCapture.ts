'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { encodeWav } from '@/lib/wav';

export type CaptureMode = 'auto' | 'hold';
export type CaptureState = 'idle' | 'armed' | 'listening' | 'processing' | 'error';

type Options = {
  /** Called with a finished speech clip, ready to upload. */
  onClip: (blob: Blob) => void;
  onError?: (message: string) => void;
};

/**
 * Drives voice capture two ways:
 *  - "auto": client-side Silero VAD (@ricky0123/vad-web) listens continuously and
 *    fires a clip whenever it detects a finished utterance.
 *  - "hold": plain MediaRecorder, active only while the mic button is held down.
 * Auto mode is the default; if the VAD model fails to load (e.g. no network
 * access to fetch its wasm/onnx assets), capture falls back to hold mode.
 */
export function useVoiceCapture({ onClip, onError }: Options) {
  const [mode, setMode] = useState<CaptureMode>('auto');
  const [state, setState] = useState<CaptureState>('idle');

  const vadRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const onClipRef = useRef(onClip);
  onClipRef.current = onClip;

  const teardownVad = useCallback(() => {
    try {
      vadRef.current?.pause();
      vadRef.current?.destroy?.();
    } catch {
      /* noop */
    }
    vadRef.current = null;
  }, []);

  const initAuto = useCallback(async () => {
    setState('armed');
    try {
      const vadModule = await import('@ricky0123/vad-web');
      const vad = await vadModule.MicVAD.new({
        onSpeechStart: () => setState('listening'),
        onVADMisfire: () => setState('armed'),
        onSpeechEnd: (audio: Float32Array) => {
          setState('processing');
          const blob = encodeWav(audio, 16000);
          onClipRef.current(blob);
          setState('armed');
        },
        positiveSpeechThreshold: 0.6,
        minSpeechFrames: 4,
      });
      vadRef.current = vad;
      vad.start();
      setState('armed');
    } catch (err) {
      console.warn('VAD failed to initialize, falling back to hold-to-talk', err);
      setMode('hold');
      setState('idle');
      onError?.('Auto-listening is unavailable, so use hold-to-talk instead.');
    }
  }, [onError]);

  useEffect(() => {
    if (mode === 'auto') {
      initAuto();
      return () => teardownVad();
    }
    return () => teardownVad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const startHold = useCallback(async () => {
    if (mode !== 'hold') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setState('processing');
        onClipRef.current(blob);
        setState('idle');
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setState('listening');
    } catch (err) {
      console.error(err);
      setState('error');
      onError?.('Microphone access was denied or unavailable.');
    }
  }, [mode, onError]);

  const stopHold = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleMode = useCallback(() => {
    teardownVad();
    setMode((m) => (m === 'auto' ? 'hold' : 'auto'));
  }, [teardownVad]);

  return { mode, state, startHold, stopHold, toggleMode, setMode };
}
