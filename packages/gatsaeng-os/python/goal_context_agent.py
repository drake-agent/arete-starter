"""Goal Context Agent — Claude API를 사용한 목표 진단 + 마일스톤 제안."""

import logging
from anthropic import Anthropic
from typing import Optional
import json

logger = logging.getLogger(__name__)

import vault_io
from config import ANTHROPIC_API_KEY, AGENT_MODEL, LIMITS

client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

SYSTEM_PROMPT = """당신은 갓생 OS의 Goal Context Agent입니다.
사용자의 목표 데이터, 마일스톤 진행률, 루틴 실행 기록, 사주 타이밍을 분석하여:

1. **진단 (ai_diagnosis)**: 현재 목표 상태를 2-3문장으로 평가
2. **방향 (ai_direction)**: 다음 2주간 구체적 행동 제안 (1-2문장)
3. **마일스톤 제안 (suggested_milestones)**: 필요시 새 마일스톤 제안 (max 4개/목표)

규칙:
- 반말, 직설적, 숫자 기반
- "잘 될 거야" 같은 위로 금지
- 사주 타이밍이 있으면 "이 시기에 ~에 유리/불리" 형태만 사용
- 마일스톤은 측정 가능한 수치 목표만
- 전체 답변은 JSON으로

응답 형식:
{
  "ai_diagnosis": "...",
  "ai_direction": "...",
  "ai_next_review": "YYYY-MM-DD",
  "suggested_milestones": [
    {"title": "...", "target_value": N, "unit": "...", "due_date": "YYYY-MM-DD"}
  ]
}"""


def build_context(goal_id: str) -> str:
    """Build context string for the agent."""
    goal = vault_io.read_goal(goal_id)
    if not goal:
        return ''

    parts = [f"## 목표: {goal['data'].get('title', '')}"]

    # Goal details
    gd = goal['data']
    parts.append(f"- 유형: {gd.get('type', '?')}")
    parts.append(f"- 상태: {gd.get('status', '?')}")
    if gd.get('target_value'):
        parts.append(f"- 진행: {gd.get('current_value', 0)}/{gd.get('target_value', 0)} {gd.get('unit', '')}")
    if gd.get('due_date'):
        parts.append(f"- 마감: {gd.get('due_date')}")
    if gd.get('why_statement'):
        parts.append(f"- Why: {gd.get('why_statement')}")
    if gd.get('identity_statement'):
        parts.append(f"- Identity: {gd.get('identity_statement')}")
    if goal.get('content'):
        parts.append(f"\n### 노트:\n{goal['content']}")

    # Key metrics
    metrics = gd.get('key_metrics', [])
    if metrics:
        parts.append('\n### 핵심 지표:')
        for m in metrics:
            parts.append(f"- {m.get('name', '?')}: {m.get('current', 0)}/{m.get('target', 0)} {m.get('unit', '')}")

    # Milestones
    milestones = vault_io.get_active_milestones()
    goal_milestones = [m for m in milestones if m.get('goal_id') == goal_id]
    if goal_milestones:
        parts.append(f'\n### 마일스톤 ({len(goal_milestones)}/{LIMITS["MAX_MILESTONES_PER_GOAL"]}):')
        for m in goal_milestones:
            progress = round(m.get('current_value', 0) / max(m.get('target_value', 1), 1) * 100)
            parts.append(f"- {m.get('title', '?')}: {progress}% (D{'-' if m.get('d_day', 0) >= 0 else '+'}{abs(m.get('d_day', 0))})")

    # Linked routines
    routines = vault_io.get_routines_with_status()
    linked = [r for r in routines if r.get('goal_id') == goal_id]
    if linked:
        parts.append('\n### 연결된 루틴:')
        for r in linked:
            status = '✅' if r.get('completed_today') else '⬜'
            parts.append(f"- {status} {r.get('title', '?')} (연속 {r.get('streak', 0)}일)")

    # Timing context
    timing = vault_io.get_current_timing()
    if timing:
        parts.append(f"\n### 이달 운기:")
        parts.append(f"- 주기: {timing.get('pillar', '?')} ({timing.get('rating', '?')}/5)")
        parts.append(f"- 테마: {timing.get('theme', '?')}")
        parts.append(f"- 인사이트: {timing.get('insight', '?')}")

    # Recent scores
    today_score = vault_io.get_today_score()
    yesterday_score = vault_io.get_yesterday_score()
    parts.append(f"\n### 스코어: 오늘 {today_score}점 / 어제 {yesterday_score}점")

    # Context data files
    context_files = vault_io.read_context_data(goal_id)
    if context_files:
        parts.append(f"\n### 업로드된 컨텍스트 데이터: {len(context_files)}개")
        for cf in context_files:
            parts.append(f"- {cf['name']} ({cf['size']} bytes)")

    return '\n'.join(parts)


def analyze_goal(goal_id: str) -> Optional[dict]:
    """Run Goal Context Agent analysis."""
    if not client:
        return None

    context = build_context(goal_id)
    if not context:
        return None

    try:
        response = client.messages.create(
            model=AGENT_MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[
                {'role': 'user', 'content': context}
            ],
        )
        text = response.content[0].text
    except Exception as e:
        logger.error(f'Anthropic API call failed for goal {goal_id}: {e}')
        return None

    # Parse JSON from response
    try:
        # Handle potential markdown code blocks
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            text = text.split('```')[1].split('```')[0]
        result = json.loads(text.strip())
    except (json.JSONDecodeError, IndexError):
        result = {
            'ai_diagnosis': text[:200],
            'ai_direction': '',
            'ai_next_review': '',
            'suggested_milestones': [],
        }

    return result


def run(goal_id: str) -> dict:
    """Full agent run: analyze + update goal + create milestones."""
    result = analyze_goal(goal_id)
    if not result:
        return {'error': 'Analysis failed or API key missing'}

    # Update goal with AI fields
    updates = {}
    if result.get('ai_diagnosis'):
        updates['ai_diagnosis'] = result['ai_diagnosis']
    if result.get('ai_direction'):
        updates['ai_direction'] = result['ai_direction']
    if result.get('ai_next_review'):
        updates['ai_next_review'] = result['ai_next_review']

    if updates:
        vault_io.update_entity('goals', goal_id, updates)

    # Create suggested milestones (respecting limit)
    created_milestones = []
    existing = vault_io.get_active_milestones()
    goal_ms_count = len([m for m in existing if m.get('goal_id') == goal_id])

    for ms in result.get('suggested_milestones', []):
        if goal_ms_count >= LIMITS['MAX_MILESTONES_PER_GOAL']:
            break
        new_ms = vault_io.create_entity('milestones', {
            'goal_id': goal_id,
            'title': ms.get('title', ''),
            'target_value': ms.get('target_value', 0),
            'current_value': 0,
            'unit': ms.get('unit', ''),
            'due_date': ms.get('due_date', ''),
            'status': 'active',
            'created_by': 'ai',
        })
        created_milestones.append(new_ms)
        goal_ms_count += 1

    return {
        'diagnosis': result.get('ai_diagnosis'),
        'direction': result.get('ai_direction'),
        'next_review': result.get('ai_next_review'),
        'milestones_created': len(created_milestones),
    }
