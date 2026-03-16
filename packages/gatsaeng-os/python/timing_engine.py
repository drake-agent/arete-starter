"""사주 Timing Engine — 사전 계산된 월운 데이터 기반 타이밍 컨텍스트 제공."""

from datetime import date, timedelta
from typing import Optional

import vault_io


def get_current_context() -> Optional[dict]:
    """현재 월운 컨텍스트를 반환."""
    return vault_io.get_current_timing()


def get_monthly_briefing() -> str:
    """월운 기반 모닝 브리핑 컨텍스트 생성."""
    timing = get_current_context()
    if not timing:
        return ''

    rating = timing.get('rating', 3)
    parts = []

    # Rating-based frame
    if rating >= 4:
        parts.append(f"이번 달({timing.get('pillar', '')})은 적극적으로 움직일 타이밍이야.")
    elif rating == 3:
        parts.append(f"이번 달({timing.get('pillar', '')})은 기존 루틴 유지에 집중.")
    else:
        parts.append(f"이번 달({timing.get('pillar', '')})은 신중하게. 무리한 확장은 보류.")

    # Theme
    if timing.get('theme'):
        parts.append(f"테마: {timing['theme']}")

    # Action guide
    guides = timing.get('action_guide', [])
    if guides:
        parts.append('실행 가이드:')
        for g in guides[:3]:
            parts.append(f'  - {g}')

    # Caution
    cautions = timing.get('caution', [])
    if cautions:
        parts.append('주의:')
        for c in cautions[:2]:
            parts.append(f'  - {c}')

    return '\n'.join(parts)


def get_timing_score_modifier(event_type: str) -> float:
    """운세에 따른 점수 보정 계수 (0.8 ~ 1.2)."""
    timing = get_current_context()
    if not timing:
        return 1.0

    rating = timing.get('rating', 3)

    # 유리한 달에는 보너스, 불리한 달에는 감소 없음 (벌점은 주지 않음)
    if rating >= 4:
        return 1.1  # 10% 보너스
    elif rating == 5:
        return 1.2  # 20% 보너스

    return 1.0


def get_goal_timing_advice(goal_id: str) -> str:
    """특정 목표에 대한 타이밍 기반 조언."""
    timing = get_current_context()
    goal = vault_io.read_goal(goal_id)

    if not timing or not goal:
        return ''

    rating = timing.get('rating', 3)
    theme = timing.get('theme', '')
    goal_type = goal['data'].get('type', '')
    goal_title = goal['data'].get('title', '')

    advice = []

    if rating >= 4:
        advice.append(f"'{goal_title}' — 이 달은 확장에 유리. 마일스톤 달성 속도를 높여라.")
        if 'networking' in theme.lower() or '인맥' in theme or '관계' in theme:
            advice.append("특히 사람을 통한 기회가 열리는 시기. 협업 제안 적극적으로.")
    elif rating <= 2:
        advice.append(f"'{goal_title}' — 이 달은 기초 다지기에 집중. 새로운 시작보다 완성.")
        advice.append("무리한 목표 수정보다 기존 루틴 유지가 더 효과적.")
    else:
        advice.append(f"'{goal_title}' — 균형 잡힌 시기. 현재 페이스 유지하면서 미세 조정.")

    return '\n'.join(advice)


def should_trigger_reanalysis(goal_id: str) -> bool:
    """목표 재분석이 필요한지 판단."""
    goal = vault_io.read_goal(goal_id)
    if not goal:
        return False

    next_review = goal['data'].get('ai_next_review')
    if not next_review:
        return True  # 한 번도 분석 안 함

    try:
        review_date = date.fromisoformat(str(next_review)[:10])
        return date.today() >= review_date
    except ValueError:
        return True


def get_all_due_reanalyses() -> list[str]:
    """재분석이 필요한 모든 목표 ID 반환."""
    goals = vault_io.get_active_goals()
    return [g['id'] for g in goals if should_trigger_reanalysis(g['id'])]
