#!/usr/bin/env python3
"""
Profile Engine v2 — @orrery/core 결과 → USER-PROFILE.md

혼천의 만세력 + DFW 동적 생성 + 공명 프레임워크 통합.
"""

from datetime import datetime
from ..core.manseryeok_v2 import SajuResult, calculate_saju
from .dfw_v2 import generate_all_dfws, detect_hapgeo, SIPSIN_KR

# ── 일간별 성향 ──────────────────────────────────────────────

일간_성향 = {
    '甲': {'type': '돌파형 리더', 'tone': '방향 정하셨으면 바로 가세요', 'strength': '개척, 시작, 돌파', 'risk': '유연성 부족'},
    '乙': {'type': '적응형 전략가', 'tone': '환경 읽고 나서 움직여도 늦지 않아요', 'strength': '적응력, 유연성', 'risk': '주체성 부족'},
    '丙': {'type': '확산형 에너지', 'tone': '에너지 관리가 핵심이에요', 'strength': '열정, 영향력', 'risk': '에너지 소진'},
    '丁': {'type': '집중형 장인', 'tone': '하나에 깊이 들어가세요', 'strength': '집중, 정밀, 완성도', 'risk': '시야 협소'},
    '戊': {'type': '안정형 컨테이너', 'tone': '기반 먼저. 기반 없이 올리면 무너져요', 'strength': '안정감, 포용력', 'risk': '변화 거부'},
    '己': {'type': '수용형 양육자', 'tone': '남의 것 챙기기 전에 본인 먼저요', 'strength': '수용, 실용', 'risk': '자기 소진'},
    '庚': {'type': '결단형 실행가', 'tone': '결정하셨으면 잡음 무시하고 밀어붙이세요', 'strength': '결단, 추진', 'risk': '융통성 부족'},
    '辛': {'type': '정제형 완벽주의', 'tone': '80%면 출발입니다', 'strength': '정제, 감각, 품질', 'risk': '완벽주의 마비'},
    '壬': {'type': '전략형 탐색자', 'tone': '아이디어 3개 중 1개만 고르세요', 'strength': '전략, 가능성 탐색', 'risk': '분산, 실행 부족'},
    '癸': {'type': '직관형 관찰자', 'tone': '느낌이 맞아요. 근데 데이터로 확인하고 가시죠', 'strength': '직관, 관찰', 'risk': '수동성'},
}

# ── 격국 매핑 (월지 본기 십신 → 격국명) ──────────────────────

격국_from_sipsin = {
    '비견': '건록격', '겁재': '양인격',
    '식신': '식신격', '상관': '상관격',
    '편재': '편재격', '정재': '정재격',
    '편관': '편관격', '정관': '정관격',
    '편인': '편인격', '정인': '정인격',
}

격국_보정 = {
    '편재격': {'자동반응': '속도와 기회 추구', '보정': '하나만 골라라'},
    '정재격': {'자동반응': '안정과 축적', '보정': '리스크 감수 구간을 정해라'},
    '식신격': {'자동반응': '산출물 과잉', '보정': '팔 수 있는 것만 만들어라'},
    '상관격': {'자동반응': '표현 과잉', '보정': '듣는 시간을 늘려라'},
    '정관격': {'자동반응': '규칙 집착', '보정': '예외를 허용하는 구간'},
    '편관격': {'자동반응': '구조 재편 욕구', '보정': '기존 구조 먼저 파악'},
    '정인격': {'자동반응': '학습 과잉', '보정': '배운 것을 산출물로 바꿔라'},
    '편인격': {'자동반응': '사유 집착', '보정': '느린 게 정상'},
    '건록격': {'자동반응': '독립 욕구', '보정': '파트너를 시스템으로 확보'},
    '양인격': {'자동반응': '추진력 과잉', '보정': '브레이크 시스템'},
}


def generate_profile(saju: SajuResult) -> str:
    """SajuResult → USER-PROFILE.md 텍스트."""

    ilgan = saju.ilgan
    trait = 일간_성향.get(ilgan, {})

    # 격국 판정 (월주 지지 십신 기반)
    month_p = saju.month_pillar
    month_branch_sipsin_kr = SIPSIN_KR.get(month_p.branch_sipsin, '')
    격국 = 격국_from_sipsin.get(month_branch_sipsin_kr, '불명')
    os_corr = 격국_보정.get(격국, {})

    # 신강약 간이 판정 (인성+비겁 vs 나머지)
    counts = saju.sipsin_counts
    helping = counts['비겁'] + counts['인성']
    draining = counts['식상'] + counts['재성'] + counts['관성']
    strength = '신강' if helping > draining else ('신약' if draining > helping else '중화')

    # 용신 간이 도출
    오행_매핑 = {'甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'}
    ilgan_oh = 오행_매핑.get(ilgan, '?')
    생_나 = {'木': '水', '火': '木', '土': '火', '金': '土', '水': '金'}
    내가_생 = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'}
    용신 = 생_나.get(ilgan_oh, '?') if strength != '신강' else 내가_생.get(ilgan_oh, '?')
    용신_역할 = '부조(에너지 보충)' if strength != '신강' else '설기(에너지 분출)'

    # DFW
    dfws = generate_all_dfws(saju)

    # 대운
    current_dw = saju.get_current_daewoon()

    # 에너지 위험 신호
    warnings = []
    if counts['인성'] == 0:
        warnings.append('인성 부재 — 자기 충전 구조가 없음. 외부 시스템/사람으로 보충 필요')
    if counts['비겁'] == 0:
        warnings.append('비겁 부재 — 혼자 다 하려는 패턴 위험. 파트너/위임 필수')
    if counts['식상'] >= 3:
        warnings.append(f'식상 {counts["식상"]}개 — 아이디어 폭주 주의. 동시 프로젝트 2개 이하 제한')
    if counts['재성'] == 0 and counts['식상'] >= 2:
        warnings.append('식상만 있고 재성 없음 — 만들지만 교환(수익화)이 약함')

    # 4주 정보
    pillars_str = ' | '.join(f"{p.position}:{p.ganzi}" for p in saju.pillars)

    md = f"""# USER-PROFILE.md — 공명 프레임워크 기반 운영 매뉴얼
> 자동 생성: {datetime.now().strftime('%Y-%m-%d %H:%M')}
> saju-engine v2.0 (@orrery/core 기반)

## 1. 원국 구조
- 사주: {pillars_str}
- 일간: {ilgan} ({오행_매핑.get(ilgan, '?')})
- 격국: {격국} (월지 {month_p.branch} 본기 십신: {month_branch_sipsin_kr})
- 신강/신약: {strength}
- 용신: {용신} ({용신_역할})

## 2. 핵심 공식
> 사건 강도 ∝ (현재 진폭) × (구조 적합성) × (운의 파장) × cos(위상차)
> 유일한 조작 변수 = 위상 (태도, 선택, 배치)
> "운을 바꾸려 하지 말고, 구조를 정렬하라."

## 3. 십신 배치
"""
    for p in saju.pillars:
        ss_kr = SIPSIN_KR.get(p.stem_sipsin, p.stem_sipsin)
        bs_kr = SIPSIN_KR.get(p.branch_sipsin, p.branch_sipsin)
        md += f"- {p.position}주: {p.ganzi} | 천간:{ss_kr} 지지:{bs_kr} | 운성:{p.unseong} | 지장간:{p.jigang}\n"
    md += f"- 대분류: 비겁{counts['비겁']} 식상{counts['식상']} 재성{counts['재성']} 관성{counts['관성']} 인성{counts['인성']}\n"

    # 일간 성향
    md += f"""
## 4. 일간 성향 (코칭 톤) — 가설
- 타입: {trait.get('type', '?')}
- 코칭 톤: "{trait.get('tone', '?')}"
- 강점: {trait.get('strength', '?')}
- 위험: {trait.get('risk', '?')}
- **대화에서 확인/수정 필요**

## 5. 격국 OS 보정 — 가설
- 격국: {격국}
- 자동 반응: {os_corr.get('자동반응', '?')}
- 보정: {os_corr.get('보정', '?')}
- **대화에서 확인/수정 필요**
"""

    # 합거
    md += "\n## 6. 합거\n"
    if dfws['hapgeo']:
        for h in dfws['hapgeo']:
            if h['type'] == '직접합거':
                md += f"- **{h['pair']}합**: {h['target_sipshin']}에 묶임 — {h['direction']}\n"
            else:
                md += f"- {h['pair']}합 (간접): {h.get('impact', '')}\n"
    else:
        md += "- 합거 없음\n"

    # 순생 체인
    md += "\n## 7. 순생 체인\n"
    if dfws['chains']:
        for c in dfws['chains']:
            md += f"- {c['name']}: {c['flow']}\n"
    else:
        md += "- 순생 체인 미감지\n"

    # DFW
    md += "\n## 8. DFW (의사결정 필터)\n"
    if dfws['total_count'] == 0:
        md += "- 특별한 DFW 불필요\n"
    else:
        for d in dfws['dfw1']:
            md += f"\n### {d['label']}\n- 트리거: {d['trigger']}\n- 대기: {d['delay']}\n"
            for i, q in enumerate(d['questions'], 1):
                md += f"- Q{i}: {q}\n"
        for d in dfws['dfw2']:
            md += f"\n### {d['label']}\n- 트리거: {d['trigger']}\n"
            for q in d['questions']:
                md += f"- {q}\n"
        for d in dfws['dfw3']:
            md += f"\n### {d['label']}\n- 트리거: {d['trigger']}\n"
            for q in d['questions']:
                md += f"- {q}\n"
            md += f"- 근거: {d['reason']}\n"

    # 에너지 위험 신호
    md += "\n## 9. 에너지 위험 신호\n"
    for w in warnings:
        md += f"- ⚠️ {w}\n"
    if not warnings:
        md += "- 특별한 구조적 위험 신호 없음\n"

    # 대운
    md += "\n## 10. 현재 대운\n"
    if current_dw:
        md += f"- {current_dw.ganzi} ({current_dw.age}세~) | {current_dw.stem_sipsin}/{current_dw.branch_sipsin}\n"

    md += """
## 11. 코칭 원칙
> 이 프로파일의 성향/패턴은 **가설**입니다.
> Eve는 대화를 통해 확인/기각합니다.
> "당신은 이래요"가 아니라 "이런 경향이 보이는데, 실제로도 그래요?"
> 확인된 패턴만 코칭에 사용합니다.
> "운을 바꾸려 하지 말고, 구조를 정렬하라."
"""

    return md


# ── CLI ──────────────────────────────────────────────────────────

def main():
    import sys
    if len(sys.argv) < 4:
        print("Usage: python3 -m saju_engine.coaching.profile_engine_v2 <year> <month> <day> [hour] [M/F]")
        sys.exit(1)

    y, m, d = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
    h = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] not in ('M', 'F') else 12
    g = sys.argv[-1] if sys.argv[-1] in ('M', 'F') else 'M'

    saju = calculate_saju(y, m, d, h, 0, g)
    print(generate_profile(saju))


if __name__ == '__main__':
    main()
