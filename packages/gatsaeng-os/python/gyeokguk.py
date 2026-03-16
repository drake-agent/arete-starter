"""격국 기여도 판정 — 행동이 격국 방향 전진인지 판단."""

from typing import Optional

import vault_io
import timing_engine


# DK의 격국 핵심 요소 (memory/helper/profile.md 기반)
# 편재격: 확장/실행/결과 중심
GYEOKGUK_KEYWORDS = {
    'forward': [
        '실행', '완료', '도전', '확장', '성장', '네트워킹', '협업',
        '마케팅', '세일즈', '사업', '투자', '결과물', '런칭',
        '결정', '추진', '시도', '테스트', '제안', '계약',
    ],
    'backward': [
        '관망', '미루기', '회피', '불안', '과분석', '완벽주의',
        '소극적', '거절', '포기', '삭제', '취소',
    ],
    'neutral': [
        '학습', '연구', '정리', '계획', '분석', '리팩토링',
        '유지', '모니터링', '기록',
    ],
}


def judge_action(action_text: str) -> dict:
    """행동 텍스트가 격국 방향 전진인지 판정.

    Returns:
        {
            'direction': 'forward' | 'backward' | 'neutral',
            'score': 1 | -1 | 0,
            'reason': str
        }
    """
    text_lower = action_text.lower()

    forward_hits = [kw for kw in GYEOKGUK_KEYWORDS['forward'] if kw in text_lower]
    backward_hits = [kw for kw in GYEOKGUK_KEYWORDS['backward'] if kw in text_lower]

    if forward_hits and not backward_hits:
        return {
            'direction': 'forward',
            'score': 1,
            'reason': f"격국 전진: {', '.join(forward_hits[:3])}",
        }
    elif backward_hits and not forward_hits:
        return {
            'direction': 'backward',
            'score': -1,
            'reason': f"격국 후퇴: {', '.join(backward_hits[:3])}",
        }
    elif forward_hits and backward_hits:
        # 둘 다 포함 → 비율로 판정
        if len(forward_hits) > len(backward_hits):
            return {
                'direction': 'forward',
                'score': 1,
                'reason': f"전진 우세: {', '.join(forward_hits[:2])} vs {', '.join(backward_hits[:1])}",
            }
        else:
            return {
                'direction': 'neutral',
                'score': 0,
                'reason': "전진/후퇴 혼재. 행동 방향 명확히 할 것.",
            }
    else:
        return {
            'direction': 'neutral',
            'score': 0,
            'reason': "격국 방향성 미감지. 행동이 구체적이어야 판정 가능.",
        }


def judge_daily_actions() -> dict:
    """오늘의 완료된 행동들의 격국 기여도 합산."""
    routines = vault_io.get_routines_with_status()
    done_routines = [r for r in routines if r.get('completed_today')]

    forward = 0
    backward = 0
    neutral = 0
    details = []

    for r in done_routines:
        result = judge_action(r.get('title', ''))
        details.append({
            'action': r.get('title', ''),
            **result,
        })
        if result['score'] > 0:
            forward += 1
        elif result['score'] < 0:
            backward += 1
        else:
            neutral += 1

    total = forward + backward + neutral
    net_score = forward - backward

    return {
        'date': vault_io.read_today_tasks()['data'].get('date', ''),
        'forward': forward,
        'backward': backward,
        'neutral': neutral,
        'net_score': net_score,
        'verdict': _verdict(net_score, total),
        'details': details,
    }


def _verdict(net_score: int, total: int) -> str:
    """판정 문구."""
    if total == 0:
        return "행동 없음. 0은 0이다."
    if net_score > 0:
        return f"오늘 격국 방향 전진 (+{net_score}). 이 방향 유지."
    elif net_score < 0:
        return f"오늘 격국 방향 후퇴 ({net_score}). 관망 본능 감지. 내일 실행 1개라도 추가."
    else:
        return "중립. '했다'는 성장이 아니다. 방향성 있는 행동을 추가하라."


def get_growth_scorecard() -> dict:
    """성장 스코어카드 — 최근 7일 격국 기여도."""
    from datetime import date, timedelta

    today = date.today()
    weekly_forward = 0
    weekly_backward = 0
    daily_results = []

    for i in range(7):
        d = (today - timedelta(days=i)).isoformat()
        log = vault_io.get_entity_by_date('routine_logs', d)
        if not log:
            daily_results.append({'date': d, 'net_score': 0, 'actions': 0})
            continue

        completions = log['data'].get('completions', [])
        day_forward = 0
        day_backward = 0

        for c in completions:
            rid = c.get('routine_id', '')
            routine = vault_io.get_entity('routines', rid)
            if routine:
                result = judge_action(routine['data'].get('title', ''))
                if result['score'] > 0:
                    day_forward += 1
                elif result['score'] < 0:
                    day_backward += 1

        weekly_forward += day_forward
        weekly_backward += day_backward
        daily_results.append({
            'date': d,
            'net_score': day_forward - day_backward,
            'actions': len(completions),
        })

    return {
        'period': f"{(today - timedelta(days=6)).isoformat()} ~ {today.isoformat()}",
        'weekly_forward': weekly_forward,
        'weekly_backward': weekly_backward,
        'weekly_net': weekly_forward - weekly_backward,
        'daily': list(reversed(daily_results)),
        'verdict': _verdict(weekly_forward - weekly_backward, weekly_forward + weekly_backward),
    }
