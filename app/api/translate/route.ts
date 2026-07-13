import { GoogleGenAI, Type } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { languageByCode } from '@/lib/languages';

export const runtime = 'nodejs';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });

// Define models in priority order
const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-3.1-flash-lite'];

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Server is missing GEMINI_API_KEY. Add it to .env.local and restart.' },
      { status: 500 },
    );
  }

  try {
    const form = await req.formData();
    const audio = form.get('audio');
    const langACode = String(form.get('langA') ?? 'en');
    const langBCode = String(form.get('langB') ?? 'es');

    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: 'No audio clip was received.' }, { status: 400 });
    }

    const langA = languageByCode(langACode);
    const langB = languageByCode(langBCode);
    const arrayBuffer = await audio.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = audio.type || 'audio/webm';

    // No manual "who's speaking" toggle: Gemini both detects which of the two
    // configured shore languages was spoken AND translates into the other one,
    // in a single pass.
    const prompt = `You are a real-time interpreter for a two-way conversation between a
${langA.hint} speaker and a ${langB.hint} speaker.

Listen to the attached short audio clip and:
1. Determine which of these two languages was spoken:
   - Language A: ${langA.hint}
   - Language B: ${langB.hint}
   Set "spokenSide" to "A" or "B" accordingly. If the audio doesn't clearly match either
   language, pick whichever is the closer match.
2. Set "detectedLanguage" to the common English name of the language actually spoken
   (this may differ from A/B if the speaker used a third language).
3. Transcribe exactly what was said, in the original language, into "sourceText".
4. Translate that transcription into the *other* shore's language (if spokenSide is
   "A", translate into ${langB.hint}; if spokenSide is "B", translate into ${langA.hint}).
   Put this in "translatedText". Keep tone and meaning natural and conversational, not
   overly literal.

If the audio is silent, unintelligible, or contains no speech, set sourceText and
translatedText to an empty string, detectedLanguage to "unknown", and spokenSide to "A".
Respond with JSON only.`;

    const requestContents = [
      {
        role: 'user',
        parts: [{ inlineData: { mimeType, data: base64Audio } }, { text: prompt }],
      },
    ];

    const requestConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          spokenSide: { type: Type.STRING, enum: ['A', 'B'] },
          detectedLanguage: { type: Type.STRING },
          sourceText: { type: Type.STRING },
          translatedText: { type: Type.STRING },
        },
        required: ['spokenSide', 'detectedLanguage', 'sourceText', 'translatedText'],
      },
      temperature: 0.3,
    };

    let response;
    let lastError: unknown;

    // Iterate through models until one succeeds
    for (const model of MODELS_TO_TRY) {
      try {
        response = await genAI.models.generateContent({
          model,
          contents: requestContents,
          config: requestConfig,
        });

        if (response?.text) {
          break; // Successfully got a response, exit the fallback loop
        }
      } catch (err) {
        console.warn(`Model ${model} failed, attempting fallback...`, err);
        lastError = err;
      }
    }

    const raw = response?.text;
    if (!raw) {
      throw lastError || new Error('All model fallbacks failed to generate a response.');
    }

    const parsed = JSON.parse(raw);

    if (!parsed.sourceText?.trim()) {
      return NextResponse.json({ error: 'No speech was detected in that clip.' }, { status: 422 });
    }

    return NextResponse.json({
      spokenSide: parsed.spokenSide === 'B' ? 'B' : 'A',
      detectedLanguage: parsed.detectedLanguage ?? 'unknown',
      sourceText: parsed.sourceText,
      translatedText: parsed.translatedText,
    });
  } catch (err) {
    console.error('translate route error', err);
    const message = err instanceof Error ? err.message : 'Translation failed unexpectedly.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}