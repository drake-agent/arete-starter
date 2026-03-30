"""Gatsaeng scoring system with variable rewards (Skinner)."""

import random

BASE_SCORES = {
    'routine_complete': 10,
    'task_done': 5,
    'task_done_urgent': 15,
    'milestone_complete': 100,
    'review_written': 20,
    'data_uploaded': 10,
    'goal_25pct': 30,
    'goal_50pct': 60,
    'goal_100pct': 200,
}


def calculate(event: str, streak: int = 0) -> dict:
    """Calculate score with streak multiplier and variable bonus."""
    base = BASE_SCORES.get(event, 0)

    # streak multiplier (max 5x)
    multiplier = min(1 + streak * 0.05, 5.0)
    points = round(base * multiplier)

    # 15% variable bonus (Skinner)
    bonus_message = None
    if random.random() < 0.15:
        bonus = random.choice([5, 10, 15, 25])
        points += bonus
        bonus_message = f'🎉 보너스 +{bonus}점!'

    return {'points': points, 'bonus_message': bonus_message}
