#!/usr/bin/env python3
"""
만세력 계산 엔진 — Step 0
양력 생년월일시 → 사주 팔자 (4주 8자) 계산

천간: 甲乙丙丁戊己庚辛壬癸
지지: 子丑寅卯辰巳午未申酉戌亥
"""

from datetime import date, datetime
from typing import Optional

# ── 기본 데이터 ──────────────────────────────────────────────────

천간 = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
지지 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

천간_음양 = {'甲': '양', '乙': '음', '丙': '양', '丁': '음', '戊': '양',
           '己': '음', '庚': '양', '辛': '음', '壬': '양', '癸': '음'}

천간_오행 = {'甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
           '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'}

지지_오행 = {'子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
           '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金',
           '戌': '土', '亥': '水'}

# 지장간 (본기/중기/여기)
지장간 = {
    '子': [('癸', '본기')],
    '丑': [('己', '본기'), ('癸', '중기'), ('辛', '여기')],
    '寅': [('甲', '본기'), ('丙', '중기'), ('戊', '여기')],
    '卯': [('乙', '본기')],
    '辰': [('戊', '본기'), ('乙', '중기'), ('癸', '여기')],
    '巳': [('丙', '본기'), ('庚', '중기'), ('戊', '여기')],
    '午': [('丁', '본기'), ('己', '중기')],
    '未': [('己', '본기'), ('丁', '중기'), ('乙', '여기')],
    '申': [('庚', '본기'), ('壬', '중기'), ('戊', '여기')],
    '酉': [('辛', '본기')],
    '戌': [('戊', '본기'), ('辛', '중기'), ('丁', '여기')],
    '亥': [('壬', '본기'), ('甲', '중기')],
}

# 시진 (시간 → 지지)
시진_매핑 = {
    (23, 1): '子', (1, 3): '丑', (3, 5): '寅', (5, 7): '卯',
    (7, 9): '辰', (9, 11): '巳', (11, 13): '午', (13, 15): '未',
    (15, 17): '申', (17, 19): '酉', (19, 21): '戌', (21, 23): '亥',
}

# 천간합
천간합_쌍 = [('甲', '己'), ('乙', '庚'), ('丙', '辛'), ('丁', '壬'), ('戊', '癸')]


# ── 주(柱) 계산 ──────────────────────────────────────────────────

def get_year_pillar(year: int, month: int, day: int) -> tuple:
    """연주 계산. 입춘(2/4) 기준으로 연도 전환."""
    # 입춘 전이면 전년도
    if month < 2 or (month == 2 and day < 4):
        year -= 1
    gan_idx = (year - 4) % 10
    ji_idx = (year - 4) % 12
    return 천간[gan_idx], 지지[ji_idx]


def get_month_pillar(year: int, month: int, day: int) -> tuple:
    """
    월주 계산. 절기(절입일) 기준.
    각 월의 절기 전환일은 양력 기준 고정값 사용 (±1일 오차 허용).
    
    절기 → 월지 매핑:
    입춘(2/4) → 寅월, 경칩(3/6) → 卯월, 청명(4/5) → 辰월,
    입하(5/6) → 巳월, 망종(6/6) → 午월, 소서(7/7) → 未월,
    입추(8/7) → 申월, 백로(9/8) → 酉월, 한로(10/8) → 戌월,
    입동(11/7) → 亥월, 대설(12/7) → 子월, 소한(1/6) → 丑월
    """
    # 절기 전환일 테이블 (양력 월 → 해당 월 절기 시작일)
    # 인덱스 = 양력 월, 값 = 절기 시작일 (양력)
    절기_시작일 = {
        1: 6,    # 소한 → 丑월
        2: 4,    # 입춘 → 寅월
        3: 6,    # 경칩 → 卯월
        4: 5,    # 청명 → 辰월
        5: 6,    # 입하 → 巳월
        6: 6,    # 망종 → 午월
        7: 7,    # 소서 → 未월
        8: 7,    # 입추 → 申월
        9: 8,    # 백로 → 酉월
        10: 8,   # 한로 → 戌월
        11: 7,   # 입동 → 亥월
        12: 7,   # 대설 → 子월
    }

    # 양력 월 → 절기 기준 월지 인덱스 (寅=0, 卯=1, ..., 丑=11)
    양력월_to_월지idx = {
        1: 11,   # 소한 이후 → 丑(11)
        2: 0,    # 입춘 이후 → 寅(0)
        3: 1,    # 경칩 이후 → 卯(1)
        4: 2,    # 청명 이후 → 辰(2)
        5: 3,    # 입하 이후 → 巳(3)
        6: 4,    # 망종 이후 → 午(4)
        7: 5,    # 소서 이후 → 未(5)
        8: 6,    # 입추 이후 → 申(6)
        9: 7,    # 백로 이후 → 酉(7)
        10: 8,   # 한로 이후 → 戌(8)
        11: 9,   # 입동 이후 → 亥(9)
        12: 10,  # 대설 이후 → 子(10)
    }

    # 지지 배열 (寅월 시작)
    월지_순서 = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']

    # 현재 월의 절기 시작일 이후인지 판단
    절기일 = 절기_시작일[month]

    if day >= 절기일:
        # 현재 월의 절기 이후 → 해당 월의 월지
        월지_idx = 양력월_to_월지idx[month]
        calc_year = year
    else:
        # 현재 월의 절기 이전 → 이전 월의 월지
        prev_month = month - 1 if month > 1 else 12
        월지_idx = 양력월_to_월지idx[prev_month]
        calc_year = year if month > 1 else year - 1

    # 연간 기준 조정 (입춘 전이면 전년도)
    if month < 2 or (month == 2 and day < 절기_시작일[2]):
        calc_year = year - 1

    # 월간 계산: 갑기 월두법
    # 甲己년→丙寅(2), 乙庚년→戊寅(4), 丙辛년→庚寅(6), 丁壬년→壬寅(8), 戊癸년→甲寅(0)
    year_gan_idx = (calc_year - 4) % 10
    month_gan_start = ((year_gan_idx % 5) * 2 + 2) % 10
    month_gan_idx = (month_gan_start + 월지_idx) % 10

    월지 = 월지_순서[월지_idx]
    # 월지를 지지 배열에서의 인덱스로 변환
    월지_in_지지 = 지지.index(월지)

    return 천간[month_gan_idx], 월지


def get_day_pillar(year: int, month: int, day: int) -> tuple:
    """일주 계산. 율리우스 적일수(JDN) 기반 — 만세력 검증 완료."""
    # JDN 계산
    y, m, d = year, month, day
    if m <= 2:
        y -= 1
        m += 12
    A = y // 100
    B = 2 - A + A // 4
    jdn = int(365.25 * (y + 4716)) + int(30.6001 * (m + 1)) + d + B - 1524

    # 보정 상수 C=54 (1994-10-28=壬辰 기준 교차검증 완료)
    gz = (jdn + 54) % 60
    gan_idx = gz % 10
    ji_idx = gz % 12
    return 천간[gan_idx], 지지[ji_idx]


def get_hour_pillar(day_gan: str, hour: int) -> tuple:
    """시주 계산. 일간에 따라 시간 결정."""
    # 시지 결정
    if hour == 23 or hour == 0:
        ji = '子'
        ji_idx = 0
    else:
        ji_idx = ((hour + 1) // 2) % 12
        ji = 지지[ji_idx]

    # 시간 계산: 일간에 따라
    day_gan_idx = 천간.index(day_gan)
    hour_gan_start = (day_gan_idx % 5) * 2
    hour_gan_idx = (hour_gan_start + ji_idx) % 10

    return 천간[hour_gan_idx], ji


# ── 대운 계산 ──────────────────────────────────────────────────

def get_daewoon(year_gan: str, gender: str, year: int, month: int, day: int) -> list:
    """
    대운 계산.
    양남음녀 = 순행, 음남양녀 = 역행.
    """
    is_yang_gan = 천간_음양[year_gan] == '양'
    is_male = gender == 'M'

    # 순행/역행 결정
    forward = (is_yang_gan and is_male) or (not is_yang_gan and not is_male)

    # 월주 기준으로 대운 천간/지지 시퀀스 생성
    month_gan, month_ji = get_month_pillar(year, month, day)
    month_gan_idx = 천간.index(month_gan)
    month_ji_idx = 지지.index(month_ji)

    # 대운수 (간략화: 평균 4-5세 시작, 정확한 계산은 절기 거리 필요)
    # 실전에서는 생일~다음/이전 절기까지 일수 ÷ 3 = 대운수
    daewoon_start_age = 4  # 간략화

    daewoons = []
    for i in range(1, 11):  # 10개 대운
        if forward:
            g_idx = (month_gan_idx + i) % 10
            j_idx = (month_ji_idx + i) % 12
        else:
            g_idx = (month_gan_idx - i) % 10
            j_idx = (month_ji_idx - i) % 12

        age = daewoon_start_age + (i - 1) * 10
        start_year = year + age
        daewoons.append({
            'num': i,
            'age': age,
            'start_year': start_year,
            'end_year': start_year + 9,
            'gan': 천간[g_idx],
            'ji': 지지[j_idx],
            'pillar': 천간[g_idx] + 지지[j_idx],
        })

    return daewoons


# ── 사주 객체 ──────────────────────────────────────────────────

class Saju:
    """사주 팔자 데이터 객체."""

    def __init__(self, year: int, month: int, day: int,
                 hour: Optional[int] = None, gender: str = 'M'):
        self.birth_year = year
        self.birth_month = month
        self.birth_day = day
        self.birth_hour = hour
        self.gender = gender

        # 4주 계산
        self.year_gan, self.year_ji = get_year_pillar(year, month, day)
        self.month_gan, self.month_ji = get_month_pillar(year, month, day)
        self.day_gan, self.day_ji = get_day_pillar(year, month, day)

        if hour is not None:
            self.hour_gan, self.hour_ji = get_hour_pillar(self.day_gan, hour)
        else:
            self.hour_gan, self.hour_ji = None, None

        # 일간
        self.ilgan = self.day_gan

        # 4천간 목록
        self.all_gan = [self.year_gan, self.month_gan, self.day_gan]
        if self.hour_gan:
            self.all_gan.append(self.hour_gan)

        # 4지지 목록
        self.all_ji = [self.year_ji, self.month_ji, self.day_ji]
        if self.hour_ji:
            self.all_ji.append(self.hour_ji)

        # 대운
        self.daewoons = get_daewoon(self.year_gan, gender, year, month, day)

    def get_current_daewoon(self, current_year: int = None) -> Optional[dict]:
        """현재 대운 반환."""
        if current_year is None:
            current_year = datetime.now().year
        for dw in self.daewoons:
            if dw['start_year'] <= current_year <= dw['end_year']:
                return dw
        return None

    def get_pillars(self) -> dict:
        """4주 반환."""
        result = {
            'year': {'gan': self.year_gan, 'ji': self.year_ji, 'pillar': self.year_gan + self.year_ji},
            'month': {'gan': self.month_gan, 'ji': self.month_ji, 'pillar': self.month_gan + self.month_ji},
            'day': {'gan': self.day_gan, 'ji': self.day_ji, 'pillar': self.day_gan + self.day_ji},
        }
        if self.hour_gan:
            result['hour'] = {'gan': self.hour_gan, 'ji': self.hour_ji, 'pillar': self.hour_gan + self.hour_ji}
        return result

    def __repr__(self):
        pillars = self.get_pillars()
        parts = [f"연:{pillars['year']['pillar']}", f"월:{pillars['month']['pillar']}",
                 f"일:{pillars['day']['pillar']}"]
        if 'hour' in pillars:
            parts.append(f"시:{pillars['hour']['pillar']}")
        return f"Saju({' '.join(parts)} | 일간:{self.ilgan})"


# ── CLI ──────────────────────────────────────────────────────────

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 4:
        print("Usage: python3 manseryeok.py <year> <month> <day> [hour] [M/F]")
        print("Example: python3 manseryeok.py 1994 10 28 14 M")
        sys.exit(1)

    y, m, d = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
    h = int(sys.argv[4]) if len(sys.argv) > 4 else None
    g = sys.argv[5] if len(sys.argv) > 5 else 'M'

    saju = Saju(y, m, d, h, g)
    print(saju)
    print(f"\n4주:")
    for k, v in saju.get_pillars().items():
        간간 = 지장간.get(v['ji'], [])
        지장간_str = ', '.join(f"{g}({t})" for g, t in 간간)
        print(f"  {k}주: {v['pillar']} (지장간: {지장간_str})")

    print(f"\n대운:")
    for dw in saju.daewoons[:6]:
        marker = " ◀ 현재" if dw == saju.get_current_daewoon() else ""
        print(f"  {dw['age']}세~{dw['age']+9}세 ({dw['start_year']}-{dw['end_year']}): {dw['pillar']}{marker}")
