"""Morning Briefing & Evening Check-in Engine."""

from datetime import date, timedelta
from typing import Optional

import vault_io
import timing_engine
import scoring


def generate_morning_briefing() -> str:
    """아침 브리핑 생성 — 오늘의 갓생 계획."""
    today = date.today()
    parts = [f"## 🧭 {today.isoformat()} 모닝 브리핑\n"]

    # 1. Timing context
    timing_text = timing_engine.get_monthly_briefing()
    if timing_text:
        parts.append(f"### 이달 운기\n{timing_text}\n")

    # 2. Yesterday summary
    yesterday_score = vault_io.get_yesterday_score()
    streaks = vault_io.get_active_streaks()
    parts.append(f"### 어제 결산")
    parts.append(f"- 스코어: {yesterday_score}점")
    parts.append(f"- 연속: {streaks['current']}일 (최장: {streaks['longest']}일)\n")

    # 3. Today's routines
    routines = vault_io.get_routines_with_status()
    today_dow = today.isoweekday()
    scheduled = [r for r in routines if today_dow in r.get('scheduled_days', [1,2,3,4,5,6,7])]
    if scheduled:
        parts.append(f"### 오늘 루틴 ({len(scheduled)}개)")
        for r in scheduled:
            parts.append(f"- ⬜ {r.get('title', '?')}")
        parts.append('')

    # 4. D-day alerts
    ddays = vault_io.get_upcoming_ddays(30)
    urgent = [m for m in ddays if m.get('d_day', 999) <= 7]
    if urgent:
        parts.append("### D-day 경고")
        for m in urgent:
            parts.append(f"- D-{m.get('d_day', '?')}: {m.get('title', '?')}")
        parts.append('')

    # 5. Skipped routine alerts
    skips = vault_io.get_consecutive_skips()
    critical = {rid: count for rid, count in skips.items() if count >= 2}
    if critical:
        parts.append("### 주의 — 연속 미실행")
        for rid, count in critical.items():
            routine = vault_io.get_entity('routines', rid)
            name = routine['data'].get('title', rid) if routine else rid
            parts.append(f"- {name}: {count}일 연속 스킵")
        parts.append('')

    # 6. Focus suggestion based on energy
    profile = vault_io.read_profile()
    peak_hours = profile.get('peak_hours', [9, 10, 11])
    parts.append(f"### 오늘 포커스 타임")
    parts.append(f"피크 시간대: {', '.join(str(h) + '시' for h in peak_hours)}")

    return '\n'.join(parts)


def generate_evening_checkin() -> str:
    """저녁 체크인 — 오늘의 성과 리뷰."""
    parts = ["## 저녁 체크인\n"]

    # Today's score
    today_score = vault_io.get_today_score()
    parts.append(f"### 오늘 스코어: {today_score}점\n")

    # Routine completion
    routines = vault_io.get_routines_with_status()
    done = [r for r in routines if r.get('completed_today')]
    not_done = [r for r in routines if not r.get('completed_today')]

    if done:
        parts.append(f"### 완료 ({len(done)}개)")
        for r in done:
            parts.append(f"- ✅ {r.get('title', '?')}")
        parts.append('')

    if not_done:
        parts.append(f"### 미완료 ({len(not_done)}개)")
        for r in not_done:
            parts.append(f"- ⬜ {r.get('title', '?')}")
        parts.append('')

    # Streak status
    streaks = vault_io.get_active_streaks()
    total_routines = len(routines)
    done_count = len(done)

    if total_routines > 0 and done_count == total_routines:
        parts.append(f"전체 루틴 완료! 연속 {streaks['current']}일 🔥")
    elif done_count >= total_routines * 0.5:
        parts.append(f"절반 이상 완료. 내일은 전체 클리어를 목표로.")
    else:
        parts.append(f"오늘 실행률 낮음. 내일은 최소 {min(3, total_routines)}개 목표.")

    return '\n'.join(parts)


def generate_weekly_summary() -> str:
    """주간 요약 리포트."""
    today = date.today()
    parts = [f"## 주간 리포트 ({(today - timedelta(days=6)).isoformat()} ~ {today.isoformat()})\n"]

    # Weekly scores
    total = 0
    daily_scores = []
    for i in range(7):
        d = (today - timedelta(days=i)).isoformat()
        manifest = vault_io.get_entity_by_date('tasks', d)
        score = manifest['data'].get('gatsaeng_score', 0) if manifest else 0
        total += score
        daily_scores.append((d, score))

    parts.append(f"### 총 스코어: {total}점")
    parts.append("일별:")
    for d, s in reversed(daily_scores):
        bar = '█' * min(s // 10, 20)
        parts.append(f"  {d[-5:]}: {bar} {s}")
    parts.append('')

    # Goals progress
    goals = vault_io.get_goals_with_milestones()
    if goals:
        parts.append("### 목표 진행")
        for g in goals:
            tv = g.get('target_value', 0)
            cv = g.get('current_value', 0)
            if tv > 0:
                pct = round(cv / tv * 100)
                parts.append(f"- {g.get('title', '?')}: {pct}% ({cv}/{tv})")
        parts.append('')

    # Streaks
    streaks = vault_io.get_active_streaks()
    parts.append(f"### 스트릭: {streaks['current']}일 (최장: {streaks['longest']}일)")

    return '\n'.join(parts)
