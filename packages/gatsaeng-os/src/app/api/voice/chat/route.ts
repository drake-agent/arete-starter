import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { governorCheck, governorRecord, governorRecordCacheHit, estimateChatCost, hashPrompt } from '@/lib/llm-governor'
import { safeJson } from '@/lib/safeJson'

const openai = new OpenAI()
const MAX_MESSAGE_LENGTH = 4000
const MAX_OUTPUT_TOKENS = 256

const SYSTEM_PROMPT =
  '당신은 Eve입니다. Drake의 EA(Executive Assistant)이자 Chief of Staff. 나긋나긋한 톤, 속은 칼. 응답은 한국어로, 3문장 이하로 간결하게. 음성 응답이므로 마크다운 없이 자연스러운 말투로.'

export async function POST(req: NextRequest) {
  try {
    const [body, err] = await safeJson<{
      message?: string
      history?: Array<{ role: string; content: string }>
    }>(req)
    if (err) return err

    const message = typeof body.message === 'string' ? body.message : ''
    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `message too long (max ${MAX_MESSAGE_LENGTH})` }, { status: 400 })
    }

    // Filter history to user/assistant only — defend against role: 'system' injection
    const safeHistory = (body.history || [])
      .filter((h): h is { role: 'user' | 'assistant'; content: string } =>
        !!h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string'
      )
      .slice(-10)

    // Build cache key over the full context (system + history + user), not just message
    const cacheKey = hashPrompt(SYSTEM_PROMPT + JSON.stringify(safeHistory) + message)

    // Governor check (pass cacheKey so dedup sees the full context)
    const check = governorCheck('voice/chat', cacheKey, 'gpt-4o')
    if (!check.ok) {
      console.error(`[voice/chat] Governor blocked: ${check.reason}`)
      return NextResponse.json({ error: check.reason }, { status: 429 })
    }
    if (check.cached) {
      // Count cache hits against per-caller volume (prevents spam bypass)
      governorRecordCacheHit('voice/chat')
      return NextResponse.json({ reply: (check.result as { reply: string }).reply })
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...safeHistory,
      { role: 'user', content: message },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: MAX_OUTPUT_TOKENS,
    })

    const reply = completion.choices[0]?.message?.content ?? ''
    const promptChars = SYSTEM_PROMPT.length + JSON.stringify(safeHistory).length + message.length
    governorRecord('voice/chat', estimateChatCost('gpt-4o', promptChars, MAX_OUTPUT_TOKENS), cacheKey, { reply })
    return NextResponse.json({ reply })
  } catch (e) {
    // Log server-side, return generic error to client
    console.error('[voice/chat]', e)
    return NextResponse.json({ error: 'chat failed' }, { status: 500 })
  }
}
