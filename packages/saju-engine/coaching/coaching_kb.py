#!/usr/bin/env python3
"""
Coaching KB — 로컬 코칭 경험 축적

Eve가 사용자와 대화하면서:
1. 가설을 확인/기각한 기록
2. 효과 있었던 개입 (DFW 발동 후 사용자가 수용)
3. 효과 없었던 개입 (사용자가 거부)
4. 사용자가 직접 말한 자기 패턴

이 모든 것을 coaching-kb에 축적하여 코칭 정확도를 높인다.
compound knowledge의 코칭 버전.

Usage:
  python3 coaching_kb.py --log '{"type":"hypothesis","id":"ilgan_multi_track","status":"confirmed","note":"실제로 동시 3-4개 진행 확인"}'
  python3 coaching_kb.py --log '{"type":"intervention","dfw":"DFW-1","accepted":true,"note":"72시간 대기 적용, 결과 좋았음"}'
  python3 coaching_kb.py --log '{"type":"self_report","pattern":"운동하면 충전됨","source":"user_direct"}'
  python3 coaching_kb.py --query "충전"
  python3 coaching_kb.py --stats
  python3 coaching_kb.py --profile-update  # confirmed 항목으로 USER-PROFILE.md 업데이트 제안
"""

import argparse
import json
import os
from datetime import datetime
from pathlib import Path


KB_ROOT = Path(os.environ.get("COACHING_KB_ROOT", os.path.join(os.getcwd(), "data", "coaching-kb")))
LOG_FILE = KB_ROOT / "coaching_log.jsonl"
PROFILE_FILE = Path(os.environ.get("USER_PROFILE_PATH", os.path.join(os.getcwd(), "USER-PROFILE.md")))


def ensure_dirs():
    KB_ROOT.mkdir(parents=True, exist_ok=True)


def log_entry(entry: dict):
    """코칭 기록 1건 추가."""
    ensure_dirs()
    entry['timestamp'] = datetime.now().isoformat()
    with open(LOG_FILE, 'a') as f:
        f.write(json.dumps(entry, ensure_ascii=False) + '\n')
    print(f"✅ 기록: {entry.get('type', '?')} — {entry.get('id', entry.get('dfw', entry.get('pattern', '?')))}")


def load_log() -> list:
    if not LOG_FILE.exists():
        return []
    entries = []
    with open(LOG_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    entries.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return entries


def query_log(keyword: str) -> list:
    """키워드로 코칭 로그 검색."""
    entries = load_log()
    keyword_lower = keyword.lower()
    results = []
    for e in entries:
        searchable = json.dumps(e, ensure_ascii=False).lower()
        if keyword_lower in searchable:
            results.append(e)
    return results


def show_stats():
    entries = load_log()
    if not entries:
        print("📊 coaching-kb: 아직 기록 없음")
        return

    types = {}
    confirmed = 0
    rejected = 0
    interventions_accepted = 0
    interventions_rejected = 0

    for e in entries:
        t = e.get('type', 'unknown')
        types[t] = types.get(t, 0) + 1
        if t == 'hypothesis':
            if e.get('status') == 'confirmed':
                confirmed += 1
            elif e.get('status') == 'rejected':
                rejected += 1
        elif t == 'intervention':
            if e.get('accepted'):
                interventions_accepted += 1
            else:
                interventions_rejected += 1

    print(f"📊 coaching-kb 통계")
    print(f"   총 기록: {len(entries)}")
    print(f"   유형: {json.dumps(types, ensure_ascii=False)}")
    print(f"   가설: {confirmed} confirmed / {rejected} rejected")
    print(f"   개입: {interventions_accepted} accepted / {interventions_rejected} rejected")
    if entries:
        print(f"   최근: {entries[-1].get('timestamp', '?')[:10]} — {entries[-1].get('type', '?')}")


def get_confirmed_hypotheses() -> list:
    """확인된 가설 목록 반환."""
    entries = load_log()
    return [e for e in entries if e.get('type') == 'hypothesis' and e.get('status') == 'confirmed']


def get_effective_interventions() -> list:
    """효과 있었던 개입 목록."""
    entries = load_log()
    return [e for e in entries if e.get('type') == 'intervention' and e.get('accepted')]


def get_self_reports() -> list:
    """사용자 직접 보고 패턴."""
    entries = load_log()
    return [e for e in entries if e.get('type') == 'self_report']


def suggest_profile_updates() -> list:
    """confirmed 항목 기반으로 USER-PROFILE.md 업데이트 제안."""
    confirmed = get_confirmed_hypotheses()
    self_reports = get_self_reports()
    effective = get_effective_interventions()

    suggestions = []

    for h in confirmed:
        suggestions.append({
            'section': '가설 → confirmed 전환',
            'id': h.get('id', '?'),
            'note': h.get('note', ''),
            'action': f"USER-PROFILE.md에서 '{h.get('id', '')}' 항목을 hypothesis → confirmed로 변경",
        })

    for sr in self_reports:
        suggestions.append({
            'section': '사용자 직접 보고 추가',
            'pattern': sr.get('pattern', ''),
            'action': f"USER-PROFILE.md § 에너지 위험 신호에 추가: '{sr.get('pattern', '')}'",
        })

    for eff in effective:
        suggestions.append({
            'section': '효과 검증된 개입',
            'dfw': eff.get('dfw', ''),
            'note': eff.get('note', ''),
            'action': f"USER-PROFILE.md § DFW에 효과 확인 표시: '{eff.get('dfw', '')}' — {eff.get('note', '')}",
        })

    return suggestions


# ── CLI ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Coaching KB Manager')
    parser.add_argument('--log', type=str, help='Log a coaching entry (JSON string)')
    parser.add_argument('--query', type=str, help='Search coaching log')
    parser.add_argument('--stats', action='store_true', help='Show stats')
    parser.add_argument('--profile-update', action='store_true', help='Suggest profile updates')
    parser.add_argument('--confirmed', action='store_true', help='List confirmed hypotheses')
    parser.add_argument('--effective', action='store_true', help='List effective interventions')

    args = parser.parse_args()

    if args.log:
        entry = json.loads(args.log)
        log_entry(entry)
        return

    if args.query:
        results = query_log(args.query)
        if not results:
            print(f"🔍 '{args.query}' — 기록 없음")
        else:
            print(f"🔍 '{args.query}' — {len(results)}건:")
            for r in results:
                print(f"  [{r.get('timestamp', '?')[:10]}] {r.get('type', '?')}: {r.get('id', r.get('dfw', r.get('pattern', '?')))}")
        return

    if args.stats:
        show_stats()
        return

    if args.profile_update:
        suggestions = suggest_profile_updates()
        if not suggestions:
            print("📋 프로파일 업데이트 제안 없음 (확인된 가설/효과 검증 개입이 아직 없음)")
        else:
            print(f"📋 프로파일 업데이트 제안 {len(suggestions)}건:")
            for s in suggestions:
                print(f"  [{s['section']}] {s['action']}")
        return

    if args.confirmed:
        for h in get_confirmed_hypotheses():
            print(f"  ✅ {h.get('id', '?')}: {h.get('note', '')}")
        return

    if args.effective:
        for e in get_effective_interventions():
            print(f"  ✅ {e.get('dfw', '?')}: {e.get('note', '')}")
        return

    parser.print_help()


if __name__ == '__main__':
    main()
