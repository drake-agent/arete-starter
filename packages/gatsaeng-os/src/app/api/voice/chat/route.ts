import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { governorCheck, governorRecord, estimateCost } from '@/lib/llm-governor'

const openai = new OpenAI()

const SYSTEM_PROMPT =
  '당신은 Eve입니다. 사용자의 EA(Executive Assistant)이자 Chief of Staff. 나긋나긋한 톤, 속은 칼. 응답은 한국어로, 3문장 이하로 간결하게. 음성 응답이므로 마크다운 없이 자연스러운 말투로.'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = (await req.json()) as {
      message: string
      history: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    // Governor check
    const check = governorCheck('voice/chat', message, 'gpt-4o')
    if (!check.ok) {
      console.error(`[voice/chat] Governor blocked: ${check.reason}`)
      return NextResponse.json({ error: check.reason }, { status: 429 })
    }
    if (check.cached) {
      return NextResponse.json({ reply: (check.result as { reply: string }).reply })
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: 'user', content: message },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 256,
    })

    const reply = completion.choices[0]?.message?.content ?? ''
    governorRecord('voice/chat', estimateCost('gpt-4o', message.length), undefined, { reply })
    return NextResponse.json({ reply })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'chat failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
