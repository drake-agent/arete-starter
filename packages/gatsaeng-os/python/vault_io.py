"""Obsidian Vault I/O — Python mirror of Node.js vault/index.ts"""

import re
import frontmatter
from pathlib import Path
from datetime import date, datetime, timedelta
from typing import Optional, Any
import yaml
import uuid

from config import FOLDERS, PROFILE_PATH, VAULT_PATH

_SAFE_ID_RE = re.compile(r'^[a-zA-Z0-9_-]+$')
_SAFE_DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def _validate_id(entity_id: str) -> str:
    if not _SAFE_ID_RE.match(entity_id):
        raise ValueError(f'Invalid entity id: {entity_id}')
    return entity_id


def _validate_date(date_str: str) -> str:
    if not _SAFE_DATE_RE.match(date_str):
        raise ValueError(f'Invalid date format: {date_str}')
    return date_str


def _ensure_dir(folder: str) -> Path:
    path = FOLDERS[folder]
    path.mkdir(parents=True, exist_ok=True)
    return path


def _gen_id() -> str:
    return uuid.uuid4().hex[:10]


# ── Read Operations ──

def list_entities(folder: str) -> list[dict[str, Any]]:
    """List all .md files in a folder, parse frontmatter."""
    path = _ensure_dir(folder)
    results = []
    for f in sorted(path.glob('*.md')):
        post = frontmatter.load(str(f))
        results.append({
            'data': dict(post.metadata),
            'content': post.content.strip(),
            'filename': f.name,
        })
    return results


def get_entity(folder: str, entity_id: str) -> Optional[dict[str, Any]]:
    """Get a single entity by ID (exact match in filename)."""
    _validate_id(entity_id)
    path = FOLDERS[folder]
    if not path.exists():
        return None
    for f in path.glob('*.md'):
        if f'-{entity_id}.' in f.name:
            post = frontmatter.load(str(f))
            return {
                'data': dict(post.metadata),
                'content': post.content.strip(),
            }
    return None


def get_entity_by_date(folder: str, date_str: str) -> Optional[dict[str, Any]]:
    """Get a date-based entity (e.g., tasks/2026-03-05.md)."""
    _validate_date(date_str)
    path = FOLDERS[folder] / f'{date_str}.md'
    if not path.exists():
        return None
    post = frontmatter.load(str(path))
    return {
        'data': dict(post.metadata),
        'content': post.content.strip(),
    }


def read_today_tasks() -> dict[str, Any]:
    """Read today's daily manifest."""
    today = date.today().isoformat()
    result = get_entity_by_date('tasks', today)
    if result:
        return result
    return {
        'data': {
            'date': today,
            'gatsaeng_score': 0,
            'routines_done': 0,
            'routines_total': 0,
            'focus_minutes': 0,
        },
        'content': '',
    }


def read_goal(goal_id: str) -> Optional[dict[str, Any]]:
    return get_entity('goals', goal_id)


def get_routines_with_status() -> list[dict[str, Any]]:
    """Get all active routines with today's completion status."""
    routines = list_entities('routines')
    today = date.today().isoformat()
    today_log = get_entity_by_date('routine_logs', today)

    completed_ids = set()
    if today_log and 'completions' in today_log['data']:
        for c in today_log['data']['completions']:
            completed_ids.add(c.get('routine_id', ''))

    result = []
    for r in routines:
        d = r['data']
        if d.get('is_active', True):
            d['completed_today'] = d.get('id', '') in completed_ids
            result.append(d)
    return result


def get_active_goals() -> list[dict[str, Any]]:
    """Get all active goals."""
    goals = list_entities('goals')
    return [g['data'] for g in goals if g['data'].get('status') == 'active']


def get_active_milestones() -> list[dict[str, Any]]:
    """Get all active milestones with D-day calculation."""
    milestones = list_entities('milestones')
    today = date.today()
    result = []
    for m in milestones:
        d = m['data']
        if d.get('status') == 'active' and d.get('due_date'):
            try:
                due = date.fromisoformat(str(d['due_date'])[:10])
                d['d_day'] = (due - today).days
                result.append(d)
            except (ValueError, TypeError):
                continue
    return sorted(result, key=lambda x: x.get('d_day', 999))


def get_goals_with_milestones() -> list[dict[str, Any]]:
    """Get goals with their milestones and D-day info."""
    goals = get_active_goals()
    milestones = get_active_milestones()

    for goal in goals:
        goal_id = goal.get('id', '')
        goal['milestones'] = [m for m in milestones if m.get('goal_id') == goal_id]
    return goals


def get_current_timing() -> Optional[dict[str, Any]]:
    """Get the current month's timing context."""
    today = date.today()
    timings = list_entities('timing')
    for t in timings:
        d = t['data']
        start = d.get('period_start', '')
        end = d.get('period_end', '')
        if start and end:
            start_date = date.fromisoformat(str(start)[:10])
            end_date = date.fromisoformat(str(end)[:10])
            if start_date <= today <= end_date:
                return d
    return None


def get_active_streaks() -> dict[str, Any]:
    """Get current and longest streaks from profile."""
    profile = read_profile()
    return {
        'current': profile.get('current_streak', 0),
        'longest': profile.get('longest_streak', 0),
    }


def get_today_score() -> int:
    """Get today's gatsaeng score."""
    today_data = read_today_tasks()
    return today_data['data'].get('gatsaeng_score', 0)


def get_yesterday_score() -> int:
    """Get yesterday's gatsaeng score."""
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    result = get_entity_by_date('tasks', yesterday)
    if result:
        return result['data'].get('gatsaeng_score', 0)
    return 0


def get_unchecked_today() -> list[dict[str, Any]]:
    """Get routines and tasks not yet completed today."""
    routines = get_routines_with_status()
    unchecked = [r for r in routines if not r.get('completed_today', False)]
    return unchecked


def get_consecutive_skips() -> dict[str, int]:
    """Check consecutive days routines were skipped."""
    routines = list_entities('routines')
    active_routines = {r['data']['id']: r['data'] for r in routines if r['data'].get('is_active')}

    skips: dict[str, int] = {rid: 0 for rid in active_routines}
    streak_broken: set[str] = set()
    today = date.today()

    for days_ago in range(1, 8):  # check last 7 days
        check_date = (today - timedelta(days=days_ago)).isoformat()
        log = get_entity_by_date('routine_logs', check_date)
        completed_ids = set()
        if log and 'completions' in log['data']:
            for c in log['data']['completions']:
                completed_ids.add(c.get('routine_id', ''))

        for rid in active_routines:
            if rid in streak_broken:
                continue  # already found a completion, skip
            r = active_routines[rid]
            day_of_week = (today - timedelta(days=days_ago)).isoweekday()
            scheduled = r.get('scheduled_days', [1,2,3,4,5,6,7])
            if day_of_week in scheduled:
                if rid not in completed_ids:
                    skips[rid] += 1
                else:
                    streak_broken.add(rid)  # stop counting for this routine

    return {rid: count for rid, count in skips.items() if count > 0}


def get_upcoming_ddays(days: int = 90) -> list[dict[str, Any]]:
    """Get milestones with D-day within range."""
    milestones = get_active_milestones()
    return [m for m in milestones if 0 < m.get('d_day', 999) <= days]


def read_profile() -> dict[str, Any]:
    """Read user profile."""
    if not PROFILE_PATH.exists():
        return {
            'display_name': 'Drake',
            'level': 1,
            'total_score': 0,
            'longest_streak': 0,
            'current_streak': 0,
            'peak_hours': [9, 10, 11],
        }
    post = frontmatter.load(str(PROFILE_PATH))
    return dict(post.metadata)


def read_last_review() -> Optional[dict[str, Any]]:
    """Read the most recent weekly review."""
    reviews = list_entities('reviews')
    weekly = [r for r in reviews if 'weekly' in r['filename'] or r['data'].get('type') == 'weekly']
    if not weekly:
        return None
    weekly.sort(key=lambda x: x['data'].get('week_start', ''), reverse=True)
    return weekly[0]


def read_context_data(goal_id: str) -> list[dict[str, Any]]:
    """Read context-data files for a goal."""
    context_dir = FOLDERS['goals'] / goal_id / 'context-data'
    if not context_dir.exists():
        return []
    files = []
    for f in context_dir.iterdir():
        files.append({
            'name': f.name,
            'path': str(f),
            'size': f.stat().st_size,
            'suffix': f.suffix,
        })
    return files


def read_recent_tasks(days: int = 14) -> list[dict[str, Any]]:
    """Read task manifests for recent days."""
    today = date.today()
    results = []
    for i in range(days):
        d = (today - timedelta(days=i)).isoformat()
        result = get_entity_by_date('tasks', d)
        if result:
            results.append(result)
    return results


# ── Write Operations ──

def create_entity(folder: str, data: dict[str, Any], body: str = '') -> dict[str, Any]:
    """Create a new entity file."""
    path = _ensure_dir(folder)
    entity_id = data.get('id') or _gen_id()
    data['id'] = entity_id

    prefix = folder.rstrip('s')
    filename = f'{prefix}-{entity_id}.md'

    post = frontmatter.Post(body, **data)
    filepath = path / filename
    filepath.write_text(frontmatter.dumps(post), encoding='utf-8')

    return data


def create_date_entity(folder: str, date_str: str, data: dict[str, Any], body: str = '') -> dict[str, Any]:
    """Create a date-based entity file."""
    path = _ensure_dir(folder)
    post = frontmatter.Post(body, **data)
    filepath = path / f'{date_str}.md'
    filepath.write_text(frontmatter.dumps(post), encoding='utf-8')
    return data


def update_entity(folder: str, entity_id: str, updates: dict[str, Any], body: Optional[str] = None) -> Optional[dict[str, Any]]:
    """Update an entity's frontmatter."""
    _validate_id(entity_id)
    path = FOLDERS[folder]
    for f in path.glob('*.md'):
        if f'-{entity_id}.' in f.name:
            post = frontmatter.load(str(f))
            for k, v in updates.items():
                post.metadata[k] = v
            if body is not None:
                post.content = body
            f.write_text(frontmatter.dumps(post), encoding='utf-8')
            return dict(post.metadata)
    return None


def check_routine(routine_id: str) -> dict[str, Any]:
    """Mark a routine as completed today."""
    today = date.today().isoformat()
    now = datetime.now().isoformat()

    log = get_entity_by_date('routine_logs', today)

    if log:
        completions = log['data'].get('completions', [])
        # check if already completed
        if any(c.get('routine_id') == routine_id for c in completions):
            return log['data']
        completions.append({
            'routine_id': routine_id,
            'completed_at': now,
        })
        log['data']['completions'] = completions
        create_date_entity('routine_logs', today, log['data'])
    else:
        data = {
            'date': today,
            'completions': [{
                'routine_id': routine_id,
                'completed_at': now,
            }],
        }
        create_date_entity('routine_logs', today, data)
        log = {'data': data}

    # update streak
    routine = get_entity('routines', routine_id)
    if routine:
        streak = routine['data'].get('streak', 0) + 1
        longest = max(routine['data'].get('longest_streak', 0), streak)
        update_entity('routines', routine_id, {
            'streak': streak,
            'longest_streak': longest,
        })

    return log['data']


def update_today_score(delta: int) -> int:
    """Add points to today's score."""
    today = date.today().isoformat()
    manifest = read_today_tasks()
    new_score = manifest['data'].get('gatsaeng_score', 0) + delta
    manifest['data']['gatsaeng_score'] = new_score
    create_date_entity('tasks', today, manifest['data'], manifest.get('content', ''))

    # update profile total
    profile = read_profile()
    profile['total_score'] = profile.get('total_score', 0) + delta
    update_profile(profile)

    return new_score


def update_profile(updates: dict[str, Any]) -> dict[str, Any]:
    """Update user profile."""
    if PROFILE_PATH.exists():
        post = frontmatter.load(str(PROFILE_PATH))
        for k, v in updates.items():
            post.metadata[k] = v
        PROFILE_PATH.write_text(frontmatter.dumps(post), encoding='utf-8')
        return dict(post.metadata)
    else:
        post = frontmatter.Post('', **updates)
        PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        PROFILE_PATH.write_text(frontmatter.dumps(post), encoding='utf-8')
        return updates


def save_context_file(goal_id: str, filename: str, content: bytes) -> Path:
    """Save a context-data file for a goal."""
    _validate_id(goal_id)
    safe_filename = Path(filename).name  # strip any directory traversal
    if not safe_filename or safe_filename.startswith('.'):
        raise ValueError(f'Invalid filename: {filename}')
    context_dir = FOLDERS['goals'] / goal_id / 'context-data'
    context_dir.mkdir(parents=True, exist_ok=True)
    filepath = context_dir / safe_filename
    filepath.write_bytes(content)
    return filepath


def get_heatmap(weeks: int = 52) -> list[dict[str, Any]]:
    """Get completion data for heatmap (last N weeks)."""
    today = date.today()
    data = []
    for i in range(weeks * 7):
        d = today - timedelta(days=i)
        d_str = d.isoformat()
        log = get_entity_by_date('routine_logs', d_str)
        manifest = get_entity_by_date('tasks', d_str)

        completions = 0
        if log and 'completions' in log['data']:
            completions = len(log['data']['completions'])

        score = 0
        if manifest:
            score = manifest['data'].get('gatsaeng_score', 0)

        data.append({
            'date': d_str,
            'completions': completions,
            'score': score,
            'day_of_week': d.isoweekday(),
        })

    return list(reversed(data))
