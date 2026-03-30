#!/usr/bin/env python3
"""
십신 배치 + 합거/순생 체인 감지 — Step 4
일간 기준으로 모든 천간/지지의 십성을 판정하고,
합거 존재 여부, 순생 체인을 자동 감지한다.
"""

from typing import Optional
from .manseryeok import Saju, 천간, 지지, 천간_오행, 지지_오행, 천간_음양, 지장간, 천간합_쌍

# ── 오행 상생상극 ──────────────────────────────────────────────

오행_상생 = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'}
오행_상극 = {'木': '土', '土': '水', '水': '火', '火': '金', '金': '木'}


# ── 십성 계산 ──────────────────────────────────────────────────

def get_십성(일간: str, 대상: str) -> str:
    """
    일간 기준으로 대상 천간의 십성을 반환.
    """
    일_오행 = 천간_오행[일간]
    대_오행 = 천간_오행[대상]
    일_음양 = 천간_음양[일간]
    대_음양 = 천간_음양[대상]
    같은_음양 = 일_음양 == 대_음양

    if 일_오행 == 대_오행:
        return '비견' if 같은_음양 else '겁재'
    elif 오행_상생[일_오행] == 대_오행:  # 내가 생하는 것
        return '식신' if 같은_음양 else '상관'
    elif 오행_상극[일_오행] == 대_오행:  # 내가 극하는 것
        return '편재' if 같은_음양 else '정재'
    elif 오행_상생[대_오행] == 일_오행:  # 나를 생하는 것
        return '편인' if 같은_음양 else '정인'
    elif 오행_상극[대_오행] == 일_오행:  # 나를 극하는 것
        return '편관' if 같은_음양 else '정관'

    return '불명'


def get_지지_십성(일간: str, ji: str) -> str:
    """지지의 본기 기준 십성."""
    본기_목록 = 지장간.get(ji, [])
    if not 본기_목록:
        return '불명'
    본기 = 본기_목록[0][0]  # 본기
    return get_십성(일간, 본기)


# ── 십신 배치표 ──────────────────────────────────────────────────

def get_full_sipshin(saju: Saju) -> dict:
    """사주 전체의 십신 배치를 반환."""
    일간 = saju.ilgan
    result = {
        'ilgan': 일간,
        'pillars': {},
        'counts': {'비겁': 0, '식상': 0, '재성': 0, '관성': 0, '인성': 0},
        'detail_counts': {},
    }

    # 천간 십성
    names = ['year', 'month', 'day', 'hour']
    for i, gan in enumerate(saju.all_gan):
        name = names[i]
        if gan == 일간 and name == 'day':
            ss = '일간'
        else:
            ss = get_십성(일간, gan)

        ji = saju.all_ji[i]
        ji_ss = get_지지_십성(일간, ji)

        result['pillars'][name] = {
            'gan': gan,
            'gan_sipshin': ss,
            'ji': ji,
            'ji_sipshin': ji_ss,
            'jijangg': [(g, t, get_십성(일간, g)) for g, t in 지장간.get(ji, [])],
        }

        # 카운팅 (일간 제외)
        for sipshin in [ss, ji_ss]:
            if sipshin == '일간':
                continue
            result['detail_counts'][sipshin] = result['detail_counts'].get(sipshin, 0) + 1
            # 대분류
            if sipshin in ('비견', '겁재'):
                result['counts']['비겁'] += 1
            elif sipshin in ('식신', '상관'):
                result['counts']['식상'] += 1
            elif sipshin in ('편재', '정재'):
                result['counts']['재성'] += 1
            elif sipshin in ('편관', '정관'):
                result['counts']['관성'] += 1
            elif sipshin in ('편인', '정인'):
                result['counts']['인성'] += 1

    return result


# ── 오행 분포 ──────────────────────────────────────────────────

def get_ohang_distribution(saju: Saju) -> dict:
    """오행 분포 비율 계산."""
    counts = {'木': 0, '火': 0, '土': 0, '金': 0, '水': 0}
    total = 0

    for gan in saju.all_gan:
        counts[천간_오행[gan]] += 1
        total += 1

    for ji in saju.all_ji:
        counts[지지_오행[ji]] += 1
        total += 1

    distribution = {}
    for oh, cnt in counts.items():
        distribution[oh] = {
            'count': cnt,
            'ratio': round(cnt / total * 100, 1) if total > 0 else 0,
        }

    return distribution


# ── 합거 감지 ──────────────────────────────────────────────────

def detect_hapgeo(saju: Saju) -> list:
    """
    원국 4천간에서 천간합 존재 여부 감지.
    합 상대가 일간에게 어떤 십성인지 → 끌려가는 방향 동적 결정.
    """
    일간 = saju.ilgan
    원국_천간 = saju.all_gan

    끌려감_매핑 = {
        '비견': '동류에 묶임 — 경쟁/비교에 에너지 소진',
        '겁재': '경쟁에 묶임 — 뺏길까봐 조급해짐',
        '식신': '표현에 묶임 — 만들어야 한다는 강박',
        '상관': '표현 과잉에 묶임 — 말하고 보여주는 것에 끌려감',
        '편재': '기회에 묶임 — 돈/기회 냄새에 자동 반응',
        '정재': '안정에 묶임 — 안정/돈에 끌려감',
        '편관': '구조/권력에 묶임 — 해야 할 것에 끌려감',
        '정관': '책임에 묶임 — 의무감에 자동 반응',
        '편인': '사유에 묶임 — 생각만 하고 행동 안 함',
        '정인': '학습에 묶임 — 배우기만 하고 산출 안 함',
    }

    합거_결과 = []
    for a, b in 천간합_쌍:
        if a in 원국_천간 and b in 원국_천간:
            if a == 일간:
                상대 = b
                유형 = '직접합거'
            elif b == 일간:
                상대 = a
                유형 = '직접합거'
            else:
                # 간접 합거
                ss_a = get_십성(일간, a)
                ss_b = get_십성(일간, b)
                합거_결과.append({
                    'pair': f'{a}{b}',
                    'type': '간접합거',
                    'impact': f'{ss_a}과 {ss_b}이 묶여서 둘 다 약화',
                })
                continue

            십성 = get_십성(일간, 상대)
            합거_결과.append({
                'pair': f'{a}{b}',
                'type': 유형,
                'target_sipshin': 십성,
                'direction': 끌려감_매핑.get(십성, '불명'),
            })

    return 합거_결과


# ── 순생 체인 감지 ──────────────────────────────────────────────

def detect_sunsaeng_chain(saju: Saju) -> list:
    """
    원국에서 순생 체인(오행이 연속 상생하는 구조)을 감지.
    """
    sipshin = get_full_sipshin(saju)
    counts = sipshin['counts']

    chains = []

    # 식상생재 체인
    if counts['식상'] >= 1 and counts['재성'] >= 1:
        chain = {'name': '식상생재', 'flow': '만든다→교환한다', 'present': True}
        if counts['관성'] >= 1:
            chain['flow'] = '만든다→교환한다→구조화한다'
            chain['name'] = '식상생재생관'
        chains.append(chain)

    # 재생관 체인
    if counts['재성'] >= 1 and counts['관성'] >= 1:
        chain = {'name': '재생관', 'flow': '교환한다→구조화한다', 'present': True}
        if counts['인성'] >= 1:
            chain['flow'] = '교환한다→구조화한다→학습한다'
            chain['name'] = '재생관생인'
        chains.append(chain)

    # 관인상생 체인
    if counts['관성'] >= 1 and counts['인성'] >= 1:
        chain = {'name': '관인상생', 'flow': '구조화한다→학습한다', 'present': True}
        if counts['비겁'] >= 1:
            chain['flow'] = '구조화한다→학습한다→독립한다'
            chain['name'] = '관인생비'
        chains.append(chain)

    # 인비생식 체인
    if counts['인성'] >= 1 and counts['비겁'] >= 1:
        chain = {'name': '인비상생', 'flow': '학습한다→독립한다', 'present': True}
        if counts['식상'] >= 1:
            chain['flow'] = '학습한다→독립한다→만든다'
            chain['name'] = '인비생식'
        chains.append(chain)

    return chains


# ── CLI ──────────────────────────────────────────────────────────

if __name__ == '__main__':
    import sys
    sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent))
    from core.manseryeok import Saju

    if len(sys.argv) < 4:
        print("Usage: python3 -m core.sipshin <year> <month> <day> [hour] [M/F]")
        sys.exit(1)

    y, m, d = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
    h = int(sys.argv[4]) if len(sys.argv) > 4 else None
    g = sys.argv[5] if len(sys.argv) > 5 else 'M'

    saju = Saju(y, m, d, h, g)
    print(saju)

    ss = get_full_sipshin(saju)
    print(f"\n십신 배치:")
    for name, p in ss['pillars'].items():
        print(f"  {name}주: {p['gan']}({p['gan_sipshin']}) {p['ji']}({p['ji_sipshin']})")

    print(f"\n대분류: {ss['counts']}")
    print(f"상세: {ss['detail_counts']}")

    print(f"\n오행 분포:")
    for oh, data in get_ohang_distribution(saju).items():
        bar = '█' * int(data['ratio'] / 5)
        print(f"  {oh}: {data['ratio']}% {bar}")

    print(f"\n합거:")
    for h in detect_hapgeo(saju):
        print(f"  {h}")

    print(f"\n순생 체인:")
    for c in detect_sunsaeng_chain(saju):
        print(f"  {c['name']}: {c['flow']}")
