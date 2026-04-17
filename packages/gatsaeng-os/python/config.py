import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Vault
_vault_env = os.getenv('VAULT_PATH')
if not _vault_env:
    raise RuntimeError('VAULT_PATH environment variable is required. Set it in .env')
VAULT_PATH = Path(_vault_env)

# Folders
FOLDERS = {
    'areas': VAULT_PATH / 'areas',
    'goals': VAULT_PATH / 'goals',
    'milestones': VAULT_PATH / 'milestones',
    'projects': VAULT_PATH / 'projects',
    'tasks': VAULT_PATH / 'tasks',
    'routines': VAULT_PATH / 'routines',
    'reviews': VAULT_PATH / 'reviews',
    'sessions': VAULT_PATH / 'sessions',
    'timing': VAULT_PATH / 'timing',
    'routine_logs': VAULT_PATH / 'logs' / 'routine',
    'energy_logs': VAULT_PATH / 'logs' / 'energy',
    'focus_sessions': VAULT_PATH / 'logs' / 'focus',
    'books': VAULT_PATH / 'books',
    'calendar': VAULT_PATH / 'calendar',
    'notes': VAULT_PATH / 'notes',
}

PROFILE_PATH = VAULT_PATH / 'profile.md'

# API
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
AGENT_MODEL = os.getenv('AGENT_MODEL', 'claude-sonnet-4-6')

# Telegram
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID', '')

# Server
DASHBOARD_PORT = int(os.getenv('DASHBOARD_PORT', '8765'))

# Schedule
MORNING_BRIEFING = os.getenv('MORNING_BRIEFING', '07:30')
EVENING_CHECKIN = os.getenv('EVENING_CHECKIN', '22:00')
WEEKLY_REVIEW_DAY = os.getenv('WEEKLY_REVIEW_DAY', 'sunday')
PROACTIVE_CHECK_INTERVAL = int(os.getenv('PROACTIVE_CHECK_INTERVAL_HOURS', '6'))

# Constraints
LIMITS = {
    'MAX_ACTIVE_GOALS': 5,
    'MAX_ACTIVE_ROUTINES': 6,
    'MAX_DAILY_TASKS': 6,
    'MAX_ACTIVE_PROJECTS': 3,
    'MAX_MILESTONES_PER_GOAL': 4,
    'MIN_REANALYSIS_WEEKS': 2,
}

# saju-helper workspace (for KB references)
SAJU_HELPER_WORKSPACE = Path(os.path.expanduser('~/.openclaw/workspace-saju-helper'))
SAJU_KB_PATH = Path(os.getenv('SAJU_KB_PATH', os.path.expanduser('~/.openclaw/saju-kb')))
