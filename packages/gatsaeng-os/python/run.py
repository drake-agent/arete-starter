"""Entry point for the gatsaeng-os Python backend (API server only).

Telegram은 OpenClaw gateway가 처리 — 이 서버는 FastAPI만 실행.
"""

import logging
import sys

import uvicorn
from config import DASHBOARD_PORT

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
)
logger = logging.getLogger('gatsaeng')


if __name__ == '__main__':
    host = sys.argv[1] if len(sys.argv) > 1 else '127.0.0.1'
    logger.info(f'Starting Gatsaeng API server on {host}:{DASHBOARD_PORT}')
    uvicorn.run(
        'api_server:app',
        host=host,
        port=DASHBOARD_PORT,
        reload='--reload' in sys.argv,
        log_level='info',
    )
