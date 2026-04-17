import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { governorCheck, governorRecord, governorRecordCacheHit, estimateChatCost, hashPrompt } from '@/lib/llm-governor'
import { safeJson } from '@/lib/safeJson'

const execFileAsync = promisify(execFile)

const VALID_COLORS = ['violet', 'blue', 'cyan', 'emerald', 'yellow', 'orange', 'red', 'pink'] as const

const CARD_BUILDER_PROMPT = `너는 GatsaengOS 대시보드의 카드 빌더야.
사용자가 원하는 카드를 설명하면, 카드 설정을 JSON으로 반환해.

─── 사용 가능한 기존 카드 타입 ───
아래 카드 타입이 이미 구현되어 있어. 사용자 요청이 이 중 하나에 해당하면 cardType 필드로 응답해:
- "news": 실시간 뉴스 피드 (Google News RSS)
- "life_status": 6축 삶의 상태 대시보드
- "eve": Eve CoS 상태 (Pending/Handoff/제안)
- "energy": 에너지 레벨 로그
- "goals": 목표 진척 링
- "routine": 루틴 체크리스트
- "timer": 포커스 타이머
- "zeigarnik": 미완료 태스크 (Open Loops)
- "dday": D-Day 카운터
- "report-invest": 투자 리포트
- "report-beauty": 뷰티 리포트
- "report-saju": 사주 리포트

─── 응답 형식 ───

[경우 1] 기존 카드 타입에 해당하면 → cardType 필드로 응답:
{
  "cardType": "news",
  "message": "📰 뉴스 피드 카드를 추가했어요!"
}

[경우 2] 기존에 없는 완전히 새로운 카드면 → cardSpec으로 응답:
{
  "cardSpec": {
    "name": "카드 이름 (한글, 2~6자)",
    "emoji": "대표 이모지 1개",
    "color": "violet|blue|cyan|emerald|yellow|orange|red|pink 중 택1",
    "description": "카드 설명 (한글, 10~30자)",
    "defaultContent": "카드에 기본으로 표시할 텍스트 (선택사항)"
  },
  "message": "사용자에게 보낼 안내 메시지 (한줄)"
}

색상 가이드 (cardSpec 사용 시):
- violet: 창의/개인 프로젝트
- blue: 정보/데이터
- cyan: 기술/시스템
- emerald: 성장/건강/재무
- yellow: 에너지/주의
- orange: 생산성/진행
- red: 긴급/중요
- pink: 감성/뷰티/관계

예시:
입력: "뉴스 카드 추가해줘" → {"cardType":"news","message":"📰 뉴스 피드 카드를 추가했어요!"}
입력: "에너지 트래커" → {"cardType":"energy","message":"⚡ 에너지 레벨 카드를 추가했어요!"}
입력: "날씨 위젯 만들어줘" → {"cardSpec":{"name":"오늘 날씨","emoji":"🌤️","color":"cyan","description":"현재 날씨와 기온을 표시하는 위젯","defaultContent":"날씨 정보를 여기에 입력하세요"},"message":"🌤️ 오늘 날씨 카드를 만들었어요!"}

중요: JSON 외에 어떤 텍스트도 출력하지 마.`

// ─── Validation ───

interface CardSpec {
  name: string
  emoji: string
  color: string
  description: string
  defaultContent?: string
  cardType?: string
}

function validateCardSpec(raw: unknown): CardSpec | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>

  if (typeof s.name !== 'string' || s.name.length < 1 || s.name.length > 20) return null
  if (typeof s.emoji !== 'string' || s.emoji.length === 0 || s.emoji.length > 4) return null
  if (typeof s.color !== 'string' || !VALID_COLORS.includes(s.color as typeof VALID_COLORS[number])) return null
  if (typeof s.description !== 'string' || s.description.length > 100) return null

  return {
    name: s.name.slice(0, 20),
    emoji: s.emoji.slice(0, 4),
    color: s.color,
    description: (s.description || '').slice(0, 100),
    defaultContent: typeof s.defaultContent === 'string' ? s.defaultContent.slice(0, 500) : undefined,
  }
}

const VALID_CARD_TYPES = [
  'news', 'life_status', 'eve', 'energy', 'goals', 'routine',
  'timer', 'zeigarnik', 'dday', 'report-invest', 'report-beauty', 'report-saju',
] as const

function isKnownCardType(type: unknown): type is string {
  return typeof type === 'string' && VALID_CARD_TYPES.includes(type as typeof VALID_CARD_TYPES[number])
}

function extractCardSpec(text: string): { cardSpec: CardSpec | null; cardType: string | null; message: string } {
  // Helper to try parsing a JSON object
  const tryParse = (raw: string): { cardSpec: CardSpec | null; cardType: string | null; message: string } | null => {
    try {
      const parsed = JSON.parse(raw)
      // Check for existing cardType first
      if (isKnownCardType(parsed.cardType)) {
        return { cardSpec: null, cardType: parsed.cardType, message: parsed.message || '카드를 추가했어요!' }
      }
      // Fall back to cardSpec
      const spec = validateCardSpec(parsed.cardSpec)
      if (spec) return { cardSpec: spec, cardType: null, message: parsed.message || '카드를 만들었어요!' }
    } catch { /* continue */ }
    return null
  }

  // 1) Try parsing the entire response as JSON
  const r1 = tryParse(text)
  if (r1) return r1

  // 2) Try extracting JSON from markdown code block
  const codeBlock = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (codeBlock) {
    const r2 = tryParse(codeBlock[1])
    if (r2) return r2
  }

  // 3) Try finding raw JSON object (cardType)
  const rawCardType = text.match(/\{[\s\S]*"cardType"[\s\S]*\}/)
  if (rawCardType) {
    const r3 = tryParse(rawCardType[0])
    if (r3) return r3
  }

  // 4) Try finding raw JSON object (cardSpec)
  const rawCardSpec = text.match(/\{[\s\S]*"cardSpec"[\s\S]*\}/)
  if (rawCardSpec) {
    const r4 = tryParse(rawCardSpec[0])
    if (r4) return r4
  }

  return { cardSpec: null, cardType: null, message: text }
}

// ─── API Route ───

const CARD_BUILDER_TIMEOUT_MS = 15_000

export async function POST(req: NextRequest) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CARD_BUILDER_TIMEOUT_MS)

  try {
    const [body, jsonErr] = await safeJson<{ message?: string }>(req)
    if (jsonErr) { clearTimeout(timer); return jsonErr }
    const message = typeof body?.message === 'string' ? body.message.trim() : ''

    if (!message || message.length > 500) {
      clearTimeout(timer)
      return NextResponse.json({ error: 'Message required (max 500 chars)' }, { status: 400 })
    }

    const fullMessage = `${CARD_BUILDER_PROMPT}\n\n사용자 요청: ${message}`

    // Governor: rate-limit + dedup card-builder (runs LLM via openclaw agent)
    const cacheKey = hashPrompt(fullMessage)
    const check = governorCheck('cockpit/card-builder', cacheKey, 'gpt-4o')
    if (!check.ok) {
      clearTimeout(timer)
      console.error(`[cockpit/card-builder] Governor blocked: ${check.reason}`)
      return NextResponse.json({ error: check.reason }, { status: 429 })
    }
    if (check.cached) {
      clearTimeout(timer)
      governorRecordCacheHit('cockpit/card-builder')
      return NextResponse.json(check.result as object)
    }

    let stdout: string
    try {
      // execFile: no shell interpolation → no injection
      const result = await execFileAsync(
        'openclaw',
        ['agent', '--agent', 'main', '--json', '--message', fullMessage],
        { timeout: CARD_BUILDER_TIMEOUT_MS, signal: controller.signal },
      )
      stdout = result.stdout
    } catch (execErr) {
      clearTimeout(timer)
      const code = (execErr as NodeJS.ErrnoException).code
      if (code === 'ABORT_ERR' || (execErr as Error).name === 'AbortError') {
        return NextResponse.json(
          { error: 'Eve 응답 시간 초과. 잠시 후 다시 시도해주세요.' },
          { status: 504 },
        )
      }
      console.error('Card builder exec error:', execErr)
      return NextResponse.json(
        { error: 'Eve 응답을 처리할 수 없습니다. 다시 시도해주세요.' },
        { status: 502 },
      )
    }
    clearTimeout(timer)

    // Parse agent wrapper response
    let agentText = ''
    try {
      const parsed = JSON.parse(stdout)
      agentText = parsed?.result?.payloads?.[0]?.text || ''
    } catch {
      return NextResponse.json(
        { error: 'Eve 응답을 처리할 수 없습니다. 다시 시도해주세요.' },
        { status: 502 },
      )
    }

    if (!agentText) {
      return NextResponse.json({ cardSpec: null, message: 'Eve가 빈 응답을 보냈어요. 다시 시도해주세요.' })
    }

    const { cardSpec, cardType, message: eveMessage } = extractCardSpec(agentText)

    const result = {
      cardSpec,
      cardType,
      message: eveMessage,
      raw: (cardSpec || cardType) ? undefined : agentText.slice(0, 500),
    }
    governorRecord('cockpit/card-builder', estimateChatCost('gpt-4o', fullMessage.length, 512), cacheKey, result)
    return NextResponse.json(result)
  } catch (err) {
    clearTimeout(timer)
    console.error('Card builder error:', err)
    return NextResponse.json(
      { error: 'Eve 연결 실패' },
      { status: 500 },
    )
  }
}
