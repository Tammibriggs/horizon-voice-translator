# Horizon — live voice translation

Speak on one shore, hear it on the other. A Next.js app that listens to your
voice, translates it with Gemini, and speaks the translation back with
ElevenLabs — architected to run entirely on Vercel (HTTP in, audio stream out,
no persistent server needed).

```
Client (mic clip) ──HTTP POST──► /api/translate ──► Gemini (audio in, translated text out)
                                        │
Client (mic clip) ──HTTP POST──► /api/speak      ──► ElevenLabs (text in, mp3 stream out)
Client (plays audio) ◄──stream───────────┘
```

## What's inside

- **Client-side voice activity detection** — [`@ricky0123/vad-web`](https://www.npmjs.com/package/@ricky0123/vad-web)
  (Silero VAD, runs on-device via ONNX/WASM) listens continuously and clips
  out each finished utterance automatically. If the VAD model can't load
  (e.g. restrictive network), the app falls back to a **hold-to-talk** button
  automatically — no code changes needed.
- **`/api/translate`** — a Vercel serverless function that sends the raw audio
  clip straight to Gemini (`@google/genai`) and asks it to identify the
  spoken language, transcribe it, and translate it, returned as structured
  JSON.
- **`/api/speak`** — a serverless function that sends the translated text to
  ElevenLabs (`eleven_flash_v2_5`) and streams the resulting MP3 straight back
  to the browser.
- **Two-shore conversation UI** — pick a language for "Shore A" and "Shore B"
  once. There's no manual "who's talking" toggle: every clip is sent to
  Gemini along with both configured languages, and a single request both
  detects which one was actually spoken and translates into the other. Every
  exchange lands in a conversation log, replayable at any time.
- A signature audio-reactive waveform that visualizes the mic input and the
  translated speech as it plays, shifting color between the two shores.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and add your API keys:

   ```bash
   cp .env.example .env.local
   ```

   - `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/apikey)
   - `ELEVENLABS_API_KEY` — from [ElevenLabs](https://elevenlabs.io)
   - `ELEVENLABS_VOICE_ID` — optional, defaults to the built-in "Rachel" voice

3. Run it locally:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and allow microphone access.

4. Deploy to Vercel:

   ```bash
   vercel
   ```

   Add the same environment variables in your Vercel project settings
   (Project → Settings → Environment Variables).

## Notes & things you may want to tune

- **Voice**: `/api/speak` uses a single default ElevenLabs voice for every
  language. For best results per-language, consider mapping
  `targetLanguage → voiceId` and passing the right voice through from the
  client.
- **Gemini model**: uses `gemini-2.5-flash` for a good speed/quality balance.
  Swap to a different Gemini model in `app/api/translate/route.ts` if you
  need higher accuracy for low-resource languages.
- **Clip length**: VAD is tuned for short, sentence-length utterances (a few
  seconds). Very long monologues will still work but add latency, since the
  whole clip is translated as one turn.
- **Browser support**: relies on `MediaRecorder`, `AudioContext`, and WASM —
  works in all modern evergreen browsers, on both desktop and mobile Safari/Chrome.
