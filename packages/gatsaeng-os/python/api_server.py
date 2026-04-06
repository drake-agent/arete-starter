"""FastAPI server for gatsaeng-os Python backend."""

from fastapi import FastAPI, UploadFile, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB


class JudgeActionRequest(BaseModel):
    action: str = ''

import vault_io
import scoring
import timing_engine
import goal_context_agent
import briefing
import proactive
import streak
import gyeokguk
from config import DASHBOARD_PORT, LIMITS

app = FastAPI(title='Gatsaeng OS API', version='1.0.0')

# CORS for Next.js dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3100', 'http://127.0.0.1:3100'],
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/api/dashboard')
def get_dashboard():
    """Full dashboard state for single API call."""
    return {
        'routines': vault_io.get_routines_with_status(),
        'goals_with_milestones': vault_io.get_goals_with_milestones(),
        'today_tasks': vault_io.read_today_tasks(),
        'streaks': vault_io.get_active_streaks(),
        'gatsaeng_score': vault_io.get_today_score(),
        'timing': vault_io.get_current_timing(),
        'ddays': vault_io.get_upcoming_ddays(),
    }


@app.patch('/api/routines/{routine_id}/check')
def check_routine(routine_id: str):
    """Check a routine as done."""
    vault_io.check_routine(routine_id)
    streaks = vault_io.get_active_streaks()
    score = scoring.calculate('routine_complete', streaks['current'])
    vault_io.update_today_score(score['points'])
    return {'score': score, 'new_total': vault_io.get_today_score()}


@app.patch('/api/tasks/{task_id}/done')
def complete_task(task_id: str):
    """Mark a project task as done."""
    task_data = vault_io.get_entity('tasks', task_id)
    if not task_data:
        raise HTTPException(status_code=404, detail='Task not found')

    vault_io.update_entity('tasks', task_id, {'status': 'done'})
    priority = task_data['data'].get('priority', 'medium')
    event = 'task_done_urgent' if priority == 'urgent' else 'task_done'
    streaks = vault_io.get_active_streaks()
    score = scoring.calculate(event, streaks['current'])
    vault_io.update_today_score(score['points'])
    return {'score': score}


@app.post('/api/goals/{goal_id}/context')
async def upload_context(goal_id: str, file: UploadFile, bg: BackgroundTasks):
    """Upload context data for Goal Context Agent."""
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail=f'File too large (max {MAX_UPLOAD_SIZE // 1024 // 1024}MB)')
    path = vault_io.save_context_file(goal_id, file.filename, content)

    # Score for data upload
    score = scoring.calculate('data_uploaded')
    vault_io.update_today_score(score['points'])

    # Trigger Goal Context Agent in background
    bg.add_task(goal_context_agent.run, goal_id)

    return {'status': 'processing', 'file': str(path), 'score': score}


@app.post('/api/goals/{goal_id}/analyze')
async def analyze_goal(goal_id: str, bg: BackgroundTasks):
    """Trigger Goal Context Agent analysis for a goal."""
    bg.add_task(goal_context_agent.run, goal_id)
    return {'status': 'analysis_started', 'goal_id': goal_id}


@app.get('/api/goals/{goal_id}/analysis')
def get_goal_analysis(goal_id: str):
    """Get cached goal analysis result."""
    goal = vault_io.read_goal(goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail='Goal not found')
    return {
        'ai_diagnosis': goal['data'].get('ai_diagnosis'),
        'ai_direction': goal['data'].get('ai_direction'),
        'ai_next_review': goal['data'].get('ai_next_review'),
    }


@app.get('/api/milestones/ddays')
def get_ddays():
    """Get all active milestones sorted by D-day."""
    return vault_io.get_active_milestones()


@app.get('/api/timing/current')
def get_current_timing():
    """Get current month's saju timing context."""
    return vault_io.get_current_timing()


@app.get('/api/timing/briefing')
def get_timing_briefing():
    """Get timing-based briefing text."""
    return {'briefing': timing_engine.get_monthly_briefing()}


@app.get('/api/timing/goal/{goal_id}')
def get_goal_timing(goal_id: str):
    """Get timing-based advice for a specific goal."""
    return {'advice': timing_engine.get_goal_timing_advice(goal_id)}


@app.get('/api/timing/reanalysis-due')
def get_reanalysis_due():
    """Get goals that need re-analysis."""
    return {'goal_ids': timing_engine.get_all_due_reanalyses()}


@app.get('/api/heatmap')
def get_heatmap(weeks: int = 52):
    """Get heatmap data for N weeks."""
    return vault_io.get_heatmap(weeks)


@app.get('/api/constraints')
def get_constraints():
    """Get current constraint status."""
    goals = vault_io.get_active_goals()
    routines = [r for r in vault_io.list_entities('routines') if r['data'].get('is_active')]
    projects = [p for p in vault_io.list_entities('projects') if p['data'].get('status') == 'active']

    return {
        'goals': {'current': len(goals), 'max': LIMITS['MAX_ACTIVE_GOALS']},
        'routines': {'current': len(routines), 'max': LIMITS['MAX_ACTIVE_ROUTINES']},
        'projects': {'current': len(projects), 'max': LIMITS['MAX_ACTIVE_PROJECTS']},
    }


@app.get('/api/proactive')
def get_proactive_alerts():
    """Get proactive alerts (skipped routines, upcoming D-days, reanalysis)."""
    alerts = []

    # Skipped routines (2+ consecutive days)
    skips = vault_io.get_consecutive_skips()
    for rid, count in skips.items():
        if count >= 2:
            routine = vault_io.get_entity('routines', rid)
            if routine:
                alerts.append({
                    'type': 'skipped_routine',
                    'title': f'{count}일 연속 미실행',
                    'message': routine['data'].get('title', ''),
                    'routine_id': rid,
                    'skip_count': count,
                })

    # D-day warnings (≤ 7 days)
    ddays = vault_io.get_upcoming_ddays(7)
    for m in ddays:
        alerts.append({
            'type': 'milestone_dday',
            'title': f"D-{m.get('d_day', '?')}",
            'message': m.get('title', ''),
            'milestone_id': m.get('id'),
        })

    # Reanalysis due
    due_goals = timing_engine.get_all_due_reanalyses()
    for gid in due_goals:
        goal = vault_io.read_goal(gid)
        if goal:
            alerts.append({
                'type': 'reanalysis_due',
                'title': '재분석 필요',
                'message': goal['data'].get('title', ''),
                'goal_id': gid,
            })

    return alerts


@app.get('/api/briefing/morning')
def get_morning_briefing():
    """Generate morning briefing."""
    return {'text': briefing.generate_morning_briefing()}


@app.get('/api/briefing/evening')
def get_evening_checkin():
    """Generate evening check-in."""
    return {'text': briefing.generate_evening_checkin()}


@app.get('/api/briefing/weekly')
def get_weekly_summary():
    """Generate weekly summary."""
    return {'text': briefing.generate_weekly_summary()}


@app.post('/api/streak/recalculate')
def recalculate_streak():
    """Recalculate current streak."""
    return streak.calculate_streak()


@app.get('/api/gyeokguk/daily')
def get_daily_gyeokguk():
    """Get today's 격국 기여도 판정."""
    return gyeokguk.judge_daily_actions()


@app.get('/api/gyeokguk/scorecard')
def get_growth_scorecard():
    """Get weekly 격국 growth scorecard."""
    return gyeokguk.get_growth_scorecard()


@app.post('/api/gyeokguk/judge')
def judge_action(body: JudgeActionRequest):
    """Judge a specific action's 격국 contribution."""
    text = body.action
    return gyeokguk.judge_action(text)


@app.get('/api/proactive/full')
def get_full_proactive():
    """Get all proactive alerts (full engine)."""
    return proactive.check_all()


if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=DASHBOARD_PORT)
