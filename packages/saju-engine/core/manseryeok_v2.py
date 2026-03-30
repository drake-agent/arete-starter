#!/usr/bin/env python3
"""
만세력 v2 — @orrery/core 기반

혼천의(sky.told.me)의 오픈소스 엔진을 사용.
정확도: 만세력 전문 사이트와 동일 (고영창 진짜만세력 포팅).

우리 Python 코어(manseryeok.py)를 대체.
"""

import json
import subprocess
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field


BRIDGE_PATH = Path(__file__).parent / 'orrery_bridge.mjs'
ENGINE_DIR = Path(__file__).parent.parent  # saju-engine/


@dataclass
class Pillar:
    position: str  # year/month/day/hour
    ganzi: str     # e.g. "甲戌"
    stem: str      # 천간
    branch: str    # 지지
    stem_sipsin: str   # 천간 십신
    branch_sipsin: str # 지지 십신
    unseong: str   # 운성
    sinsal: str    # 신살
    jigang: str    # 지장간


@dataclass
class Daewoon:
    age: int
    ganzi: str
    stem_sipsin: str
    branch_sipsin: str
    unseong: str
    start_date: str


@dataclass
class SajuResult:
    """@orrery/core 결과를 Python 객체로."""
    ilgan: str
    pillars: list  # [Pillar]
    daewoons: list  # [Daewoon]
    relations: list
    gongmang: dict
    raw: dict  # 원본 JSON

    @property
    def year_pillar(self) -> Pillar:
        return next(p for p in self.pillars if p.position == 'year')

    @property
    def month_pillar(self) -> Pillar:
        return next(p for p in self.pillars if p.position == 'month')

    @property
    def day_pillar(self) -> Pillar:
        return next(p for p in self.pillars if p.position == 'day')

    @property
    def hour_pillar(self) -> Optional[Pillar]:
        return next((p for p in self.pillars if p.position == 'hour'), None)

    def get_current_daewoon(self, current_year: int = None) -> Optional[Daewoon]:
        if current_year is None:
            from datetime import datetime
            current_year = datetime.now().year

        birth_year = self.raw.get('input', {}).get('year', 2000)
        current_age = current_year - birth_year

        for i, dw in enumerate(self.daewoons):
            next_age = self.daewoons[i + 1].age if i + 1 < len(self.daewoons) else 999
            if dw.age <= current_age < next_age:
                return dw
        return None

    @property
    def sipsin_counts(self) -> dict:
        """십신 대분류 카운트."""
        counts = {'비겁': 0, '식상': 0, '재성': 0, '관성': 0, '인성': 0}
        mapping = {
            '比肩': '비겁', '劫財': '비겁',
            '食神': '식상', '傷官': '식상',
            '偏財': '재성', '正財': '재성',
            '偏官': '관성', '正官': '관성',
            '偏印': '인성', '正印': '인성',
        }
        for p in self.pillars:
            if p.stem_sipsin != '本元':
                cat = mapping.get(p.stem_sipsin, '')
                if cat:
                    counts[cat] += 1
            cat = mapping.get(p.branch_sipsin, '')
            if cat:
                counts[cat] += 1
        return counts

    def __repr__(self):
        parts = [f"{p.position}:{p.ganzi}" for p in self.pillars]
        return f"Saju({' '.join(parts)} | 일간:{self.ilgan})"


def calculate_saju(year: int, month: int, day: int,
                   hour: int = 12, minute: int = 0,
                   gender: str = 'M') -> SajuResult:
    """
    @orrery/core를 호출하여 사주 계산.
    """
    input_data = json.dumps({
        'year': year, 'month': month, 'day': day,
        'hour': hour, 'minute': minute, 'gender': gender,
    })

    result = subprocess.run(
        ['node', str(BRIDGE_PATH)],
        input=input_data,
        capture_output=True, text=True,
        timeout=10,
        cwd=str(ENGINE_DIR),
    )

    if result.returncode != 0:
        raise RuntimeError(f"orrery_bridge error: {result.stderr}")

    data = json.loads(result.stdout)

    if 'error' in data:
        raise RuntimeError(f"orrery error: {data['error']}")

    # Parse pillars
    pillars = []
    for p in data.get('pillars', []):
        pillars.append(Pillar(
            position=p['position'],
            ganzi=p['ganzi'],
            stem=p['stem'],
            branch=p['branch'],
            stem_sipsin=p.get('stemSipsin', ''),
            branch_sipsin=p.get('branchSipsin', ''),
            unseong=p.get('unseong', ''),
            sinsal=p.get('sinsal', ''),
            jigang=p.get('jigang', ''),
        ))

    # Parse daewoons
    daewoons = []
    for d in data.get('daewoon', []):
        daewoons.append(Daewoon(
            age=d['age'],
            ganzi=d['ganzi'],
            stem_sipsin=d.get('stemSipsin', ''),
            branch_sipsin=d.get('branchSipsin', ''),
            unseong=d.get('unseong', ''),
            start_date=d.get('startDate', ''),
        ))

    return SajuResult(
        ilgan=data['ilgan'],
        pillars=pillars,
        daewoons=daewoons,
        relations=data.get('relations', []),
        gongmang=data.get('gongmang', {}),
        raw=data,
    )


# ── CLI ──────────────────────────────────────────────────────────

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 4:
        print("Usage: python3 manseryeok_v2.py <year> <month> <day> [hour] [M/F]")
        sys.exit(1)

    y, m, d = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
    h = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] not in ('M', 'F') else 12
    g = sys.argv[-1] if sys.argv[-1] in ('M', 'F') else 'M'

    saju = calculate_saju(y, m, d, h, 0, g)
    print(saju)
    print(f"\n4주:")
    for p in saju.pillars:
        print(f"  {p.position}주: {p.ganzi} | 십신: {p.stem_sipsin}/{p.branch_sipsin} | 운성: {p.unseong} | 지장간: {p.jigang}")

    print(f"\n십신 대분류: {saju.sipsin_counts}")

    print(f"\n대운 (상위 5개):")
    for dw in saju.daewoons[:5]:
        marker = " ◀ 현재" if dw == saju.get_current_daewoon() else ""
        print(f"  {dw.age}세: {dw.ganzi} ({dw.stem_sipsin}/{dw.branch_sipsin}){marker}")
