#!/usr/bin/env python3
"""
Profile Engine — Step 0-4 결과를 USER-PROFILE.md로 출력.
온보딩 시 자동 실행되어 Eve의 코칭 기반을 만든다.
"""

import json
from datetime import datetime
from pathlib import Path

from ..core.manseryeok import Saju, 천간_오행, 천간_음양, 지장간
from ..core.sipshin import get_full_sipshin, get_ohang_distribution, detect_hapgeo, detect_sunsaeng_chain
from ..core.gyeokguk import full_analysis
from .dfw import generate_all_dfws


# ── 일간별 자연 성향 (코칭 톤 가이드) ──────────────────────────

일간_성향 = {
    '甲': {'type': '돌파형 리더', 'tone': '방향 정하셨으면 바로 가세요', 'strength': '개척, 시작, 돌파', 'risk': '유연성 부족, 꺾이면 크게 꺾임'},
    '乙': {'type': '적응형 전략가', 'tone': '환경 읽고 나서 움직여도 늦지 않아요', 'strength': '적응력, 유연성, 네트워킹', 'risk': '주체성 부족, 남의 영향에 흔들림'},
    '丙': {'type': '확산형 에너지', 'tone': '에너지 관리가 핵심이에요. 다 태우면 안 돼요', 'strength': '열정, 영향력, 확산', 'risk': '에너지 소진, 과열'},
    '丁': {'type': '집중형 장인', 'tone': '하나에 깊이 들어가세요. 넓히지 말고요', 'strength': '집중, 정밀, 완성도', 'risk': '시야 협소, 확장 어려움'},
    '戊': {'type': '안정형 컨테이너', 'tone': '기반 먼저. 기반 없이 올리면 무너져요', 'strength': '안정감, 포용력, 신뢰', 'risk': '변화 거부, 정체'},
    '己': {'type': '수용형 양육자', 'tone': '남의 것 챙기기 전에 본인 먼저요', 'strength': '수용, 양육, 실용', 'risk': '자기 소진, 경계 부족'},
    '庚': {'type': '결단형 실행가', 'tone': '결정하셨으면 잡음 무시하고 밀어붙이세요', 'strength': '결단, 추진, 정의감', 'risk': '융통성 부족, 갈등 유발'},
    '辛': {'type': '정제형 완벽주의', 'tone': '80%면 출발입니다. 100% 기다리면 늦어요', 'strength': '정제, 감각, 품질', 'risk': '완벽주의 마비, 시작 못함'},
    '壬': {'type': '전략형 탐색자', 'tone': '아이디어 3개 중 1개만 고르세요', 'strength': '전략, 다방면 사고, 가능성 탐색', 'risk': '분산, 실행 부족, 시작만 많음'},
    '癸': {'type': '직관형 관찰자', 'tone': '느낌이 맞아요. 근데 데이터로 한 번 확인하고 가시죠', 'strength': '직관, 관찰, 인내', 'risk': '수동성, 결단 지연'},
}


# ── Profile 생성 ──────────────────────────────────────────────

def generate_profile(saju: Saju) -> str:
    """사주 분석 → USER-PROFILE.md 텍스트 생성."""

    # Step 0-3 통합 분석
    analysis = full_analysis(saju)
    strength = analysis['strength']
    gyeokguk = analysis['gyeokguk']
    yongshin = analysis['yongshin']

    # Step 4
    sipshin = get_full_sipshin(saju)
    ohang = get_ohang_distribution(saju)
    hapgeo = detect_hapgeo(saju)
    chains = detect_sunsaeng_chain(saju)

    # DFW 자동 생성
    dfws = generate_all_dfws(saju)

    # 일간 성향
    ilgan_trait = 일간_성향.get(saju.ilgan, {})

    # 대운
    current_dw = saju.get_current_daewoon()

    # 에너지 위험 신호 (인성 유무 기반)
    인성_수 = sipshin['counts']['인성']
    energy_warnings = []
    if 인성_수 == 0:
        energy_warnings.append('인성 부재 — 자기 충전 구조가 없음. 외부 시스템/사람으로 보충 필요')
        energy_warnings.append('번아웃 위험 높음. 쉬라고 하면 "괜찮아"라고 하는 패턴 주의')
    비겁_수 = sipshin['counts']['비겁']
    if 비겁_수 == 0:
        energy_warnings.append('비겁 부재 — 혼자 다 하려는 패턴 위험. 파트너/위임 필수')

    # 4주 정보
    pillars = saju.get_pillars()
    pillars_str = ' | '.join(f"{k}:{v['pillar']}" for k, v in pillars.items())

    # ── 마크다운 생성 ──

    md = f"""# USER-PROFILE.md — 공명 프레임워크 기반 운영 매뉴얼
> 자동 생성: {datetime.now().strftime('%Y-%m-%d %H:%M')}
> 사주 엔진 v1.0 | 생년월일: {saju.birth_year}.{saju.birth_month}.{saju.birth_day}

## 1. 원국 구조
- 사주: {pillars_str}
- 일간: {saju.ilgan} ({천간_음양[saju.ilgan]}{천간_오행[saju.ilgan]})
- 격국: {gyeokguk['격국']} (월지 {saju.month_ji} 본기 {gyeokguk.get('본기', '?')})
- 신강/신약: {strength['strength']} (확신도: {strength['confidence']})
- 용신: {yongshin['용신']} ({yongshin['역할']})
- 희신: {yongshin['희신']}
- 기신: {yongshin['기신']}

## 2. 핵심 공식
> 사건 강도 ∝ (현재 진폭) × (구조 적합성) × (운의 파장) × cos(위상차)
> 유일한 조작 변수 = 위상 (태도, 선택, 배치)
> "운을 바꾸려 하지 말고, 구조를 정렬하라."

## 3. 오행 분포
"""
    for oh, data in ohang.items():
        bar = '█' * max(1, int(data['ratio'] / 5))
        md += f"- {oh}: {data['ratio']}% {bar}\n"

    md += f"""
## 4. 일간 성향 (코칭 톤)
- 타입: {ilgan_trait.get('type', '?')}
- 코칭 톤: "{ilgan_trait.get('tone', '?')}"
- 강점: {ilgan_trait.get('strength', '?')}
- 위험: {ilgan_trait.get('risk', '?')}
- **이것은 가설입니다.** 실제 대화에서 확인/수정되어야 합니다.

## 5. 십신 배치
"""
    for name, p in sipshin['pillars'].items():
        md += f"- {name}주: {p['gan']}({p['gan_sipshin']}) {p['ji']}({p['ji_sipshin']})\n"
    md += f"- 대분류: 비겁{sipshin['counts']['비겁']} 식상{sipshin['counts']['식상']} 재성{sipshin['counts']['재성']} 관성{sipshin['counts']['관성']} 인성{sipshin['counts']['인성']}\n"

    # 합거
    md += "\n## 6. 합거\n"
    if hapgeo:
        for h in hapgeo:
            if h['type'] == '직접합거':
                md += f"- **{h['pair']}합 (직접합거)**: {h['target_sipshin']}에 묶임 — {h['direction']}\n"
            else:
                md += f"- {h['pair']}합 (간접): {h.get('impact', '')}\n"
    else:
        md += "- 합거 없음\n"

    # 순생 체인
    md += "\n## 7. 순생 체인\n"
    if chains:
        for c in chains:
            md += f"- {c['name']}: {c['flow']}\n"
    else:
        md += "- 순생 체인 미감지\n"

    # DFW
    md += "\n## 8. DFW (의사결정 필터)\n"
    if dfws['total_count'] == 0:
        md += "- 특별한 DFW 필요 없음\n"
    else:
        for d in dfws['dfw1']:
            md += f"\n### {d['label']}\n"
            md += f"- 트리거: {d['trigger']}\n"
            md += f"- 대기: {d['delay']}\n"
            for i, q in enumerate(d['questions'], 1):
                md += f"- Q{i}: {q}\n"

        for d in dfws['dfw2']:
            md += f"\n### {d['label']}\n"
            md += f"- 트리거: {d['trigger']}\n"
            for q in d['questions']:
                md += f"- {q}\n"

        for d in dfws['dfw3']:
            md += f"\n### {d['label']}\n"
            md += f"- 트리거: {d['trigger']}\n"
            for q in d['questions']:
                md += f"- {q}\n"
            md += f"- 근거: {d['reason']}\n"

    # OS 보정
    md += "\n## 9. OS 보정 (격국 기반)\n"
    os_corr = gyeokguk.get('os_correction', {})
    if os_corr:
        md += f"- 자동 반응: {os_corr.get('자동반응', '?')}\n"
        md += f"- 보정: {os_corr.get('보정', '?')}\n"
        md += f"- 핵심: {os_corr.get('핵심', '?')}\n"
    md += "- **이것은 구조적 가설입니다.** 대화에서 확인 필요.\n"

    # 에너지 위험 신호
    md += "\n## 10. 에너지 위험 신호\n"
    if energy_warnings:
        for w in energy_warnings:
            md += f"- ⚠️ {w}\n"
    else:
        md += "- 특별한 구조적 위험 신호 없음\n"

    # 대운
    md += "\n## 11. 현재 대운\n"
    if current_dw:
        md += f"- {current_dw['pillar']} ({current_dw['start_year']}-{current_dw['end_year']})\n"
    else:
        md += "- 대운 정보 없음\n"

    md += """
## 12. 코칭 원칙
> 이 프로파일의 모든 성향/패턴은 **가설(hypothesis)**입니다.
> Eve는 대화를 통해 각 가설을 confirmed/rejected로 전환합니다.
> "당신은 이래요"가 아니라 "이런 경향이 보이는데, 실제로도 그래요?"
> 확인된 패턴만 코칭에 사용합니다.
"""

    return md


# ── CLI ──────────────────────────────────────────────────────────

def main():
    import sys
    if len(sys.argv) < 4:
        print("Usage: python3 -m saju_engine.coaching.profile_engine <year> <month> <day> [hour] [M/F]")
        sys.exit(1)

    y, m, d = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
    h = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] != 'M' and sys.argv[4] != 'F' else None
    g = sys.argv[-1] if sys.argv[-1] in ('M', 'F') else 'M'

    saju = Saju(y, m, d, h, g)
    profile = generate_profile(saju)
    print(profile)


if __name__ == '__main__':
    main()
