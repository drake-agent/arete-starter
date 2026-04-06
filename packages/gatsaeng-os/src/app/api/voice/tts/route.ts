import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { governorCheck, governorRecord, estimateCost } from '@/lib/llm-governor'

const openai = new OpenAI()
const MAX_TTS_CHARS = 1000

export async function POST(req: NextRequest) {
  try {
    const check = governorCheck('voice/tts', '', 'tts')
    if (!check.ok) {
      return new Response(JSON.stringify({ error: check.reason }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { text } = (await req.json()) as { text: string }
    if (!text) {
      return new Response(JSON.stringify({ error: 'text required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (text.length > MAX_TTS_CHARS) {
      return new Response(
        JSON.stringify({ error: `텍스트는 ${MAX_TTS_CHARS}자 이하여야 합니다.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text,
      response_format: 'mp3',
    })

    governorRecord('voice/tts', estimateCost('tts', text.length))
    return new Response(mp3.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'tts failed'
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
