import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // "Rachel" — a neutral, clear default voice

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server is missing ELEVENLABS_API_KEY. Add it to .env.local and restart.' },
      { status: 500 },
    );
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'No text was provided to speak.' }, { status: 400 });
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_flash_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );

    if (!elevenRes.ok || !elevenRes.body) {
      const detail = await elevenRes.text().catch(() => '');
      return NextResponse.json(
        { error: `ElevenLabs request failed (${elevenRes.status}): ${detail.slice(0, 300)}` },
        { status: 502 },
      );
    }

    return new NextResponse(elevenRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('speak route error', err);
    const message = err instanceof Error ? err.message : 'Speech synthesis failed unexpectedly.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
