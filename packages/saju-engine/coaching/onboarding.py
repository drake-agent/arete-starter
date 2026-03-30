#!/usr/bin/env python3
"""
온보딩 대화 Flow — 사주 프로파일링

사용자 생년월일시 → 사주 계산 → 구조 분석 → 확인 질문 자동 생성.
Eve가 이 스크립트의 출력을 읽고 대화를 진행한다.
"""

import json
from ..core.manseryeok_v2 import SajuResult, calculate_saju
from .dfw_v2 import generate_all_dfws, SIPSIN_KR
from .profile_engine_v2 import generate_profile, 일간_성향, 격국_from_sipsin


def generate_onboarding_questions(saju: SajuResult) -> list:
    """
    사주 구조에서 자동으로 확인 질문 3-5개 생성.
    Eve가 이 질문들을 사용자에게 던져서 가설을 확인/기각한다.
    """
    ilgan = saju.ilgan
    trait = 일간_성향.get(ilgan, {})
    counts = saju.sipsin_counts
    dfws = generate_all_dfws(saju)

    questions = []

    # Q1: 일간 성향 확인 (항상)
    type_name = trait.get('type', '?')
    if ilgan in ('壬', '癸'):
        questions.append({
            'id': 'ilgan_multi_track',
            'question': f"사주를 보면 {ilgan}水 일간이시네요. 보통 이 구조는 한 가지에 깊이 파기보다 여러 가능성을 동시에 보는 편인데, 실제로 어떠세요?",
            'options': ['맞아요, 여러 개 동시에 벌리는 편', '아니요, 한 가지에 집중하는 편', '상황에 따라 다름'],
            'hypothesis': 'ilgan_multi_track',
        })
    elif ilgan in ('甲', '庚'):
        questions.append({
            'id': 'ilgan_decisive',
            'question': f"{type_name} 성향이 보이는데요. 결정을 내리면 밀어붙이는 편이에요, 아니면 한 번 더 생각하는 편이에요?",
            'options': ['밀어붙이는 편', '한 번 더 생각하는 편', '중요도에 따라 다름'],
            'hypothesis': 'ilgan_decisive',
        })
    elif ilgan in ('丁', '辛'):
        questions.append({
            'id': 'ilgan_perfectionist',
            'question': f"{type_name} 성향이 보이는데요. 80% 완성된 것을 바로 내놓는 편이에요, 아니면 100% 될 때까지 다듬는 편이에요?",
            'options': ['80%면 바로 내놓음', '100% 될 때까지 다듬음', '영역에 따라 다름'],
            'hypothesis': 'ilgan_perfectionist',
        })
    else:
        questions.append({
            'id': 'ilgan_general',
            'question': f"{type_name} 성향이 보이는데요. 실제로 '{trait.get('tone', '')}'이 와닿으세요?",
            'options': ['맞아요', '아니요', '부분적으로'],
            'hypothesis': 'ilgan_general',
        })

    # Q2: 합거 확인 (있을 때만)
    if dfws['hapgeo']:
        for h in dfws['hapgeo']:
            if h['type'] == '직접합거':
                sipsin = h.get('target_sipshin', '')
                if sipsin in ('편재', '정재'):
                    questions.append({
                        'id': f'hapgeo_{h["pair"]}',
                        'question': f'원국에 {h["pair"]}합이 보여요. 새 돈 기회나 사업 제안이 오면 바로 뛰어드는 편이에요?',
                        'options': ['맞아요, 거의 바로', '좀 고민하는 편', '아니요, 신중한 편'],
                        'hypothesis': f'hapgeo_{h["pair"]}_confirmed',
                        'followup': '뛰어들었다가 잘 된 경우와 안 된 경우, 차이가 뭐였어요?',
                    })
                elif sipsin in ('편관', '정관'):
                    questions.append({
                        'id': f'hapgeo_{h["pair"]}',
                        'question': f'원국에 {h["pair"]}합이 보여요. 부탁이나 책임이 오면 거절하기 어려운 편이에요?',
                        'options': ['맞아요, 거의 다 받아들임', '선택적', '아니요, 잘 거절함'],
                        'hypothesis': f'hapgeo_{h["pair"]}_confirmed',
                    })
                break  # 합거 질문은 1개만

    # Q3: 식상 과다 확인 (해당 시)
    if counts['식상'] >= 2:
        questions.append({
            'id': 'sikssang_overload',
            'question': f'식상이 {counts["식상"]}개로 많은데요. 아이디어가 동시에 여러 개 떠오르는 경험이 자주 있으세요?',
            'options': ['자주요', '가끔', '아니요'],
            'hypothesis': 'sikssang_overload_confirmed',
        })

    # Q4: 인성 부재 확인 (해당 시)
    if counts['인성'] == 0:
        questions.append({
            'id': 'insung_absent',
            'question': '인성이 원국에 없어요. 혼자서 충전이 잘 안 되거나, 번아웃이 온 적 있으세요?',
            'options': ['자주요', '가끔', '아니요, 충전 잘 됨'],
            'hypothesis': 'insung_burnout_confirmed',
            'followup': '회복할 때 뭐가 가장 도움이 돼요? (운동, 사람, 혼자 시간 등)',
        })

    # Q5: 비겁 부재 확인 (해당 시)
    if counts['비겁'] == 0:
        questions.append({
            'id': 'bigyeop_absent',
            'question': '비겁이 없어요. "내가 직접 하는 게 빨라"라고 자주 생각하시는 편이에요?',
            'options': ['맞아요, 자주', '가끔', '아니요, 잘 맡기는 편'],
            'hypothesis': 'bigyeop_solo_pattern',
        })

    return questions[:5]  # 최대 5개


def generate_onboarding_output(year: int, month: int, day: int,
                                hour: int = 12, minute: int = 0,
                                gender: str = 'M') -> dict:
    """
    온보딩 전체 패키지 생성.
    Returns: {saju_summary, questions, profile_md}
    """
    saju = calculate_saju(year, month, day, hour, minute, gender)
    questions = generate_onboarding_questions(saju)
    profile = generate_profile(saju)

    return {
        'saju_summary': str(saju),
        'ilgan': saju.ilgan,
        'sipsin_counts': saju.sipsin_counts,
        'questions': questions,
        'profile_md': profile,
    }


# ── CLI ──────────────────────────────────────────────────────────

if __name__ == '__main__':
    import sys
    if len(sys.argv) < 4:
        print("Usage: python3 -m saju_engine.coaching.onboarding <year> <month> <day> [hour] [M/F]")
        sys.exit(1)

    y, m, d = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
    h = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] not in ('M', 'F') else 12
    g = sys.argv[-1] if sys.argv[-1] in ('M', 'F') else 'M'

    result = generate_onboarding_output(y, m, d, h, 0, g)

    print(f"=== {result['saju_summary']} ===\n")
    print(f"십신: {result['sipsin_counts']}\n")
    print("=== 온보딩 확인 질문 ===\n")
    for i, q in enumerate(result['questions'], 1):
        print(f"Q{i}: {q['question']}")
        for j, opt in enumerate(q['options']):
            print(f"   {chr(65+j)}) {opt}")
        if q.get('followup'):
            print(f"   → 후속 질문: {q['followup']}")
        print()

    print("=== USER-PROFILE.md ===\n")
    print(result['profile_md'][:2000] + "...")
