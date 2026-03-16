"""Streak Engine — 연속 실행일 계산 + 보정."""

from datetime import date, timedelta

import vault_io


def calculate_streak() -> dict:
    """현재 스트릭을 재계산하고 프로필에 반영."""
    today = date.today()
    streak = 0

    all_routines = vault_io.list_entities('routines')
    active = [r for r in all_routines if r['data'].get('is_active')]

    for days_ago in range(1, 365):
        check_date = today - timedelta(days=days_ago)
        d_str = check_date.isoformat()

        log = vault_io.get_entity_by_date('routine_logs', d_str)
        if not log or not log['data'].get('completions'):
            break
        day_of_week = check_date.isoweekday()
        scheduled = [
            r for r in active
            if day_of_week in r['data'].get('scheduled_days', [1,2,3,4,5,6,7])
        ]

        if not scheduled:
            continue  # 스케줄 없는 날은 건너뜀

        completed_ids = {c.get('routine_id', '') for c in log['data'].get('completions', [])}
        scheduled_ids = {r['data'].get('id', '') for r in scheduled}

        # 50% 이상 완료 시 스트릭 유지
        if len(completed_ids & scheduled_ids) >= len(scheduled_ids) * 0.5:
            streak += 1
        else:
            break

    # Update profile
    profile = vault_io.read_profile()
    old_longest = profile.get('longest_streak', 0)
    new_longest = max(old_longest, streak)

    vault_io.update_profile({
        'current_streak': streak,
        'longest_streak': new_longest,
    })

    return {
        'current': streak,
        'longest': new_longest,
        'changed': streak != profile.get('current_streak', 0),
    }


def get_streak_multiplier(streak: int) -> float:
    """스트릭에 따른 점수 배율 (최대 5x)."""
    if streak >= 30:
        return 5.0
    elif streak >= 21:
        return 4.0
    elif streak >= 14:
        return 3.0
    elif streak >= 7:
        return 2.0
    elif streak >= 3:
        return 1.5
    return 1.0
