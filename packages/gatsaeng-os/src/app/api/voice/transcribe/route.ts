import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    if (!(audio instanceof File)) {
      return NextResponse.json({ error: 'audio file required' }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audio,
      language: 'ko',
    })

    return NextResponse.json({ text: transcription.text })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'transcription failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
