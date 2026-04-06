"""Telegram Bot — Coach_Eve_bot 통합 갓생 코치."""

import logging
from datetime import datetime
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
)

import vault_io
import briefing
import proactive
import gyeokguk
import timing_engine
import goal_context_agent
import streak
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

logger = logging.getLogger(__name__)


def is_authorized(update: Update) -> bool:
    """Only allow configured chat_id. Fail-closed when TELEGRAM_CHAT_ID is not set."""
    if not TELEGRAM_CHAT_ID:
        logger.warning('TELEGRAM_CHAT_ID not set — rejecting all messages for safety')
        return False
    return str(update.effective_chat.id) == TELEGRAM_CHAT_ID.replace('tg:', '')


# ─── Command Handlers ───

async def cmd_start(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return
    await update.message.reply_text(
        "🧭 갓생 코치 활성화.\n"
        "/morning — 모닝 브리핑\n"
        "/check — 루틴 체크인\n"
        "/score — 오늘 스코어\n"
        "/dday — D-day 현황\n"
        "/timing — 이달 운기\n"
        "/gyeokguk — 격국 판정\n"
        "/scorecard — 성장 스코어카드\n"
        "/analyze — 목표 AI 분석"
    )


async def cmd_morning(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return
    text = briefing.generate_morning_briefing()
    await update.message.reply_text(text, parse_mode=None)


async def cmd_evening(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return
    text = briefing.generate_evening_checkin()
    await update.message.reply_text(text, parse_mode=None)


async def cmd_check(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """현재 루틴 상태 표시."""
    if not is_authorized(update):
        return
    routines = vault_io.get_routines_with_status()
    if not routines:
        await update.message.reply_text("활성 루틴 없음.")
        return

    lines = ["오늘 루틴 현황:"]
    done = 0
    for r in routines:
        status = '✅' if r.get('completed_today') else '⬜'
        lines.append(f"{status} {r.get('title', '?')} (🔥{r.get('streak', 0)}일)")
        if r.get('completed_today'):
            done += 1

    lines.append(f"\n{done}/{len(routines)} 완료")
    await update.message.reply_text('\n'.join(lines))


async def cmd_score(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return
    today_score = vault_io.get_today_score()
    streaks = vault_io.get_active_streaks()
    profile = vault_io.read_profile()

    text = (
        f"오늘 스코어: {today_score}점\n"
        f"누적: {profile.get('total_score', 0)}점 (Lv.{profile.get('level', 1)})\n"
        f"연속: {streaks['current']}일 (최장: {streaks['longest']}일)"
    )
    await update.message.reply_text(text)


async def cmd_dday(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return
    milestones = vault_io.get_active_milestones()
    if not milestones:
        await update.message.reply_text("활성 마일스톤 없음.")
        return

    lines = ["D-day 현황:"]
    for m in milestones[:8]:
        d = m.get('d_day', 0)
        label = f"D-{d}" if d > 0 else "D-Day" if d == 0 else f"D+{abs(d)}"
        progress = 0
        if m.get('target_value', 0) > 0:
            progress = round(m.get('current_value', 0) / m['target_value'] * 100)
        lines.append(f"  {label}: {m.get('title', '?')} ({progress}%)")

    await update.message.reply_text('\n'.join(lines))


async def cmd_timing(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return
    text = timing_engine.get_monthly_briefing()
    if not text:
        await update.message.reply_text("타이밍 데이터 없음.")
        return
    await update.message.reply_text(f"이달 운기:\n{text}")


async def cmd_gyeokguk(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return
    result = gyeokguk.judge_daily_actions()

    lines = [f"격국 판정 ({result.get('date', '?')}):", ""]
    for d in result.get('details', []):
        arrow = '↗' if d['score'] > 0 else '↙' if d['score'] < 0 else '→'
        lines.append(f"  {arrow} {d.get('action', '?')}: {d.get('reason', '')}")

    lines.append("")
    lines.append(f"전진 {result.get('forward', 0)} / 후퇴 {result.get('backward', 0)} / 중립 {result.get('neutral', 0)}")
    lines.append(f"판정: {result.get('verdict', '')}")

    await update.message.reply_text('\n'.join(lines))


async def cmd_scorecard(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return
    sc = gyeokguk.get_growth_scorecard()

    lines = [f"성장 스코어카드 ({sc.get('period', '')}):", ""]
    for d in sc.get('daily', []):
        bar = '█' * max(d.get('net_score', 0), 0) + '░' * max(-d.get('net_score', 0), 0)
        lines.append(f"  {d['date'][-5:]}: {bar or '·'} ({d.get('net_score', 0):+d})")

    lines.append("")
    lines.append(f"주간 순전진: {sc.get('weekly_net', 0):+d}")
    lines.append(f"판정: {sc.get('verdict', '')}")

    await update.message.reply_text('\n'.join(lines))


async def cmd_analyze(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return
    goals = vault_io.get_active_goals()
    if not goals:
        await update.message.reply_text("활성 목표 없음.")
        return

    # If goal_id specified
    args = ctx.args
    if args:
        goal_id = args[0]
    else:
        # Show list and analyze first one
        lines = ["분석할 목표:"]
        for g in goals:
            lines.append(f"  {g.get('id', '?')}: {g.get('title', '?')}")
        lines.append(f"\n첫 번째 목표 분석 중...")
        await update.message.reply_text('\n'.join(lines))
        goal_id = goals[0].get('id', '')

    await update.message.reply_text(f"🔍 '{goal_id}' 분석 중...")
    result = goal_context_agent.run(goal_id)

    if result.get('error'):
        await update.message.reply_text(f"분석 실패: {result['error']}")
        return

    lines = [
        f"AI 진단: {result.get('diagnosis', '?')}",
        f"방향: {result.get('direction', '?')}",
        f"다음 리뷰: {result.get('next_review', '?')}",
    ]
    if result.get('milestones_created', 0) > 0:
        lines.append(f"새 마일스톤 {result['milestones_created']}개 생성됨.")

    await update.message.reply_text('\n'.join(lines))


async def cmd_alerts(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    if not is_authorized(update):
        return
    alerts = proactive.check_all()
    if not alerts:
        await update.message.reply_text("현재 알림 없음. 잘 하고 있다.")
        return

    lines = ["🚨 알림:"]
    for a in alerts:
        severity = {'critical': '🔴', 'warning': '🟡', 'info': '🔵'}.get(a.get('severity', 'info'), '⚪')
        lines.append(f"  {severity} [{a.get('type', '?')}] {a.get('title', '')}: {a.get('message', '')}")

    await update.message.reply_text('\n'.join(lines))


# ─── Message Handler (Intent Classification) ───

INTENT_KEYWORDS = {
    'check': ['체크', '루틴', '완료', '했어', '끝'],
    'score': ['점수', '스코어', '몇점'],
    'timing': ['운기', '운세', '타이밍', '이달'],
    'dday': ['디데이', 'd-day', '마감', '마일스톤'],
    'gyeokguk': ['격국', '판정', '전진', '후퇴'],
    'morning': ['아침', '모닝', '브리핑', '오늘'],
    'evening': ['저녁', '체크인', '하루', '마무리'],
    'analyze': ['분석', '진단', 'ai'],
    'alerts': ['알림', '경고', '주의'],
}

async def handle_message(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
    """Free-text message intent classification."""
    if not is_authorized(update):
        return

    text = update.message.text.lower()

    # Match intent by keywords
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            handler_map = {
                'check': cmd_check,
                'score': cmd_score,
                'timing': cmd_timing,
                'dday': cmd_dday,
                'gyeokguk': cmd_gyeokguk,
                'morning': cmd_morning,
                'evening': cmd_evening,
                'analyze': cmd_analyze,
                'alerts': cmd_alerts,
            }
            handler = handler_map.get(intent)
            if handler:
                await handler(update, ctx)
                return

    # Default: show status summary
    today_score = vault_io.get_today_score()
    routines = vault_io.get_routines_with_status()
    done = sum(1 for r in routines if r.get('completed_today'))
    streaks = vault_io.get_active_streaks()

    await update.message.reply_text(
        f"스코어: {today_score}점 | 루틴: {done}/{len(routines)} | 연속: {streaks['current']}일\n\n"
        "명령어: /morning /check /score /dday /timing /gyeokguk /scorecard /analyze /alerts"
    )


# ─── Scheduled Jobs ───

async def scheduled_morning_briefing(ctx: ContextTypes.DEFAULT_TYPE):
    """매일 아침 자동 브리핑."""
    chat_id = TELEGRAM_CHAT_ID.replace('tg:', '')
    text = briefing.generate_morning_briefing()
    await ctx.bot.send_message(chat_id=chat_id, text=text)


async def scheduled_evening_checkin(ctx: ContextTypes.DEFAULT_TYPE):
    """매일 저녁 자동 체크인."""
    chat_id = TELEGRAM_CHAT_ID.replace('tg:', '')

    # Recalculate streak before evening check-in
    streak.calculate_streak()

    text = briefing.generate_evening_checkin()
    await ctx.bot.send_message(chat_id=chat_id, text=text)


async def scheduled_proactive_check(ctx: ContextTypes.DEFAULT_TYPE):
    """주기적 proactive 알림."""
    chat_id = TELEGRAM_CHAT_ID.replace('tg:', '')
    alerts = proactive.check_all()
    critical = [a for a in alerts if a.get('severity') == 'critical']

    if critical:
        lines = ["🚨 긴급 알림:"]
        for a in critical:
            lines.append(f"  {a.get('title', '')}: {a.get('message', '')}")
        await ctx.bot.send_message(chat_id=chat_id, text='\n'.join(lines))


# ─── Bot Setup ───

def create_bot() -> Application:
    """Create and configure the Telegram bot."""
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN not set")

    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Commands
    app.add_handler(CommandHandler('start', cmd_start))
    app.add_handler(CommandHandler('morning', cmd_morning))
    app.add_handler(CommandHandler('evening', cmd_evening))
    app.add_handler(CommandHandler('check', cmd_check))
    app.add_handler(CommandHandler('score', cmd_score))
    app.add_handler(CommandHandler('dday', cmd_dday))
    app.add_handler(CommandHandler('timing', cmd_timing))
    app.add_handler(CommandHandler('gyeokguk', cmd_gyeokguk))
    app.add_handler(CommandHandler('scorecard', cmd_scorecard))
    app.add_handler(CommandHandler('analyze', cmd_analyze))
    app.add_handler(CommandHandler('alerts', cmd_alerts))

    # Free text
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    return app
