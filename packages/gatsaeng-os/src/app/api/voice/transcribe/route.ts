import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { governorCheck, governorRecord, estimateCost } from '@/lib/llm-governor'

const openai = new OpenAI()
const MAX_AUDIO_SIZE = 25 * 1024 * 1024 // 25MB (Whisper API limit)

export async function POST(req: NextRequest) {
  try {
    const check = governorCheck('voice/transcribe', '', 'whisper')
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 429 })
    }

    const formData = await req.formData()
    const audio = formData.get('audio')
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'audio file required' }, { status: 400 })
    }
    if (audio.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: `File too large (max ${MAX_AUDIO_SIZE / 1024 / 1024}MB)` }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audio,
      language: 'ko',
    })

    governorRecord('voice/transcribe', estimateCost('whisper', audio.size))
    return NextResponse.json({ text: transcription.text })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'transcription failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
