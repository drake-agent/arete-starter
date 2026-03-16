"""Proactive Engine — 패턴 감지 + 사전 알림 시스템."""

from datetime import date, timedelta, datetime
from typing import Optional

import vault_io
import timing_engine


def check_all() -> list[dict]:
    """모든 proactive 체크를 실행하고 알림 목록 반환."""
    alerts = []
    alerts.extend(check_skipped_routines())
    alerts.extend(check_dday_warnings())
    alerts.extend(check_streak_danger())
    alerts.extend(check_reanalysis_due())
    alerts.extend(check_energy_pattern())
    return alerts


def check_skipped_routines() -> list[dict]:
    """2일 이상 연속 스킵된 루틴 감지."""
    alerts = []
    skips = vault_io.get_consecutive_skips()

    for rid, count in skips.items():
        if count >= 2:
            routine = vault_io.get_entity('routines', rid)
            if not routine:
                continue
            title = routine['data'].get('title', rid)

            if count >= 4:
                severity = 'critical'
                msg = f'"{title}" {count}일 연속 스킵. 습관 체인 끊길 위험. 루틴 재설계 검토 필요.'
            elif count >= 2:
                severity = 'warning'
                msg = f'"{title}" {count}일 연속 스킵. 오늘 반드시 실행하라.'

            alerts.append({
                'type': 'skipped_routine',
                'severity': severity,
                'title': f'{title} — {count}일 연속 미실행',
                'message': msg,
                'routine_id': rid,
            })

    return alerts


def check_dday_warnings() -> list[dict]:
    """마일스톤 D-day 경고."""
    alerts = []
    milestones = vault_io.get_active_milestones()

    for m in milestones:
        d = m.get('d_day', 999)
        title = m.get('title', '?')
        progress = 0
        target = m.get('target_value', 0)
        if target > 0:
            progress = round(m.get('current_value', 0) / target * 100)

        if d <= 0:
            alerts.append({
                'type': 'deadline',
                'severity': 'critical',
                'title': f'{title} — D-Day 초과!',
                'message': f'마감 {abs(d)}일 초과. 진행률 {progress}%. 즉시 완료하거나 마감 재조정.',
                'milestone_id': m.get('id'),
            })
        elif d <= 3:
            alerts.append({
                'type': 'milestone_dday',
                'severity': 'critical',
                'title': f'{title} — D-{d}',
                'message': f'진행률 {progress}%. 남은 {m.get("target_value", 0) - m.get("current_value", 0)} {m.get("unit", "")} 집중.',
                'milestone_id': m.get('id'),
            })
        elif d <= 7:
            alerts.append({
                'type': 'milestone_dday',
                'severity': 'warning',
                'title': f'{title} — D-{d}',
                'message': f'진행률 {progress}%. 마감 {d}일 전.',
                'milestone_id': m.get('id'),
            })

    return alerts


def check_streak_danger() -> list[dict]:
    """스트릭 위험 감지 — 오후 9시 이후 미완료 루틴 존재 시."""
    now = datetime.now()
    if now.hour < 21:
        return []

    unchecked = vault_io.get_unchecked_today()
    if not unchecked:
        return []

    streaks = vault_io.get_active_streaks()
    current = streaks.get('current', 0)

    if current >= 3:
        return [{
            'type': 'streak_danger',
            'severity': 'warning',
            'title': f'{current}일 스트릭 끊길 위험!',
            'message': f'{len(unchecked)}개 루틴 미완료. 자기 전에 처리하라.',
        }]

    return []


def check_reanalysis_due() -> list[dict]:
    """재분석 필요한 목표 감지."""
    alerts = []
    due = timing_engine.get_all_due_reanalyses()

    for gid in due:
        goal = vault_io.read_goal(gid)
        if not goal:
            continue
        alerts.append({
            'type': 'reanalysis_due',
            'severity': 'info',
            'title': f'"{goal["data"].get("title", "?")}" 재분석 필요',
            'message': '2주 경과. Goal Context Agent 재실행 추천.',
            'goal_id': gid,
        })

    return alerts


def check_energy_pattern() -> list[dict]:
    """에너지 패턴 감지 — 최근 3일 연속 low energy."""
    alerts = []
    today = date.today()

    low_days = 0
    for i in range(3):
        d = (today - timedelta(days=i)).isoformat()
        log = vault_io.get_entity_by_date('energy_logs', d)
        if log and 'entries' in log['data']:
            avg = sum(e.get('level', 3) for e in log['data']['entries']) / max(len(log['data']['entries']), 1)
            if avg <= 2:
                low_days += 1

    if low_days >= 3:
        alerts.append({
            'type': 'energy_warning',
            'severity': 'warning',
            'title': '3일 연속 저에너지 감지',
            'message': '회복 우선. 루틴을 절반으로 줄이고 수면/운동부터.',
        })

    return alerts
