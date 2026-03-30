#!/usr/bin/env python3
"""
DFW (의사결정 프레임워크) 동적 생성

합거 → DFW-1 (탈출 필터)
순생 체인 → DFW-2 (병목 진단)
식상 과다 → DFW-3 (과잉 필터)

모든 것이 일간/격국/원국 구조에서 동적으로 계산됨. 하드코딩 없음.
"""

from ..core.sipshin import get_십성, get_full_sipshin, detect_hapgeo, detect_sunsaeng_chain


# ── DFW-1: 합거 탈출 필터 ──────────────────────────────────────

def generate_dfw1(hapgeo_list: list) -> list:
    """
    합거 목록에서 DFW-1 필터를 동적 생성.
    십성별로 질문이 달라진다.
    """
    dfw1_sets = []

    for hap in hapgeo_list:
        if hap['type'] == '간접합거':
            continue  # 간접 합거는 DFW-1 대상 아님

        십성 = hap.get('target_sipshin', '')

        # 십성별 질문 동적 생성
        if 십성 in ('편재', '정재'):
            questions = [
                '이건 돈/기회가 끌고 가는 결정인가, 축적(시스템/학습)이 끌고 가는 결정인가?',
                '6개월 뒤 시스템 자산(IP/데이터/프로세스)이 늘어나는가?',
                '안 하면 뭘 잃는가? 일회성 기회인가, 반복 구조인가?',
            ]
            delay = '72시간'
            trigger = '새 돈 기회/투자/사업 제안이 왔을 때'

        elif 십성 in ('편관', '정관'):
            questions = [
                '이건 의무감이 끌고 가는 결정인가, 내 방향이 끌고 가는 결정인가?',
                '이걸 하면 내 구조가 강해지는가, 남의 구조를 떠받치는가?',
                '안 하면 실제로 무너지는 게 있는가?',
            ]
            delay = '48시간'
            trigger = '책임/의무/요청이 들어올 때'

        elif 십성 in ('식신', '상관'):
            questions = [
                '이건 만들고 싶어서인가, 만들어야 할 것 같아서인가?',
                '이 산출물이 시장 가치로 전환 가능한가?',
                '기존 프로젝트를 마무리하고도 여력이 있는가?',
            ]
            delay = '48시간'
            trigger = '새 프로젝트/작품/콘텐츠를 시작하려 할 때'

        elif 십성 in ('정인', '편인'):
            questions = [
                '이건 배우면 바로 쓸 수 있는 건가, 배우는 것 자체가 목적인가?',
                '지금 부족한 건 지식인가, 실행인가?',
                '이 학습이 3개월 내 산출물로 이어지는가?',
            ]
            delay = '24시간'
            trigger = '새 공부/자격증/강의를 시작하려 할 때'

        elif 십성 in ('비견', '겁재'):
            questions = [
                '이건 나만의 길인가, 남과 비교해서 생긴 욕구인가?',
                '혼자 해야 하는 이유가 진짜 있는가?',
                '파트너/시스템에 맡기면 안 되는가?',
            ]
            delay = '24시간'
            trigger = '경쟁심/비교에서 결정을 내리려 할 때'

        else:
            questions = ['이 결정의 진짜 동기는 무엇인가?']
            delay = '24시간'
            trigger = '큰 결정 전'

        dfw1_sets.append({
            'name': 'DFW-1',
            'label': f'합거 탈출 필터 ({hap["pair"]}합)',
            'pair': hap['pair'],
            'target_sipshin': 십성,
            'direction': hap.get('direction', ''),
            'trigger': trigger,
            'delay': delay,
            'questions': questions,
        })

    return dfw1_sets


# ── DFW-2: 순생 체인 병목 진단 ──────────────────────────────────

def generate_dfw2(chains: list) -> list:
    """순생 체인에서 DFW-2 병목 진단을 동적 생성."""

    병목_질문 = {
        '식상생재': [
            'Step 1: 아이디어/산출물이 나오고 있는가? → No면 에너지 고갈, 먼저 충전',
            'Step 2: 산출물이 시장 가치로 전환되고 있는가? → No면 전환 경로 재설계',
            'Step 3: 전환된 가치가 구조에 쌓이고 있는가? → No면 축적 시스템 필요',
        ],
        '식상생재생관': [
            'Step 1: 아이디어/산출물이 나오고 있는가?',
            'Step 2: 산출물이 시장 가치로 전환되고 있는가?',
            'Step 3: 전환된 가치가 구조/시스템에 쌓이고 있는가? ← 보통 여기서 막힘',
        ],
        '재생관': [
            'Step 1: 돈/성과가 들어오고 있는가?',
            'Step 2: 그게 구조/시스템/조직으로 전환되고 있는가? → No면 벌고 쓰고 반복',
        ],
        '재생관생인': [
            'Step 1: 돈/성과가 들어오고 있는가?',
            'Step 2: 구조/시스템이 학습/전문성으로 전환되고 있는가?',
        ],
        '관인상생': [
            'Step 1: 외부 구조(직장/조직)가 작동하고 있는가?',
            'Step 2: 거기서 학습/성장이 일어나고 있는가? → No면 정체',
        ],
        '인비상생': [
            'Step 1: 학습/충전이 실행력으로 전환되고 있는가?',
            'Step 2: → No면 배우기만 하고 움직이지 않는 상태',
        ],
        '인비생식': [
            'Step 1: 학습이 독립적 실행으로 전환되는가?',
            'Step 2: 실행이 산출물로 이어지는가?',
        ],
    }

    dfw2_sets = []
    for chain in chains:
        name = chain['name']
        questions = 병목_질문.get(name, [
            f"Step 1: {chain['flow']}의 첫 단계가 작동하는가?",
            f"Step 2: 중간 전환이 되고 있는가?",
            f"Step 3: 마지막 단계에 쌓이고 있는가?",
        ])

        dfw2_sets.append({
            'name': 'DFW-2',
            'label': f'순생 체인 병목 ({name})',
            'chain': name,
            'flow': chain['flow'],
            'trigger': '"바쁜데 뭔가 안 쌓인다" 체감이 올 때',
            'questions': questions,
        })

    return dfw2_sets


# ── DFW-3: 식상 과잉 필터 ──────────────────────────────────────

def generate_dfw3(sipshin_counts: dict) -> list:
    """식상이 2개 이상이면 DFW-3 생성."""

    식상_수 = sipshin_counts.get('식상', 0)
    if 식상_수 < 2:
        return []

    return [{
        'name': 'DFW-3',
        'label': f'식상 과잉 필터 (식상 {식상_수}개)',
        'trigger': '아이디어/프로젝트가 3개 이상 동시에 떠오를 때',
        'questions': [
            '72시간 후에도 살아남는 아이디어가 몇 개인가?',
            '기존 시스템에 장착 가능한가? → 불가능이면 새 시스템 필요 → 여력 확인',
            '동시 프로젝트가 2개 이하인가? → No면 대기열. 하나 끝나면 다음.',
        ],
        'reason': f'식상 {식상_수}개 + 분산되면 각각 임계치를 넘지 못함',
    }]


# ── 통합: 모든 DFW 자동 생성 ──────────────────────────────────

def generate_all_dfws(saju) -> dict:
    """사주 분석 결과에서 해당되는 모든 DFW를 자동 생성."""
    from ..core.sipshin import detect_hapgeo, detect_sunsaeng_chain, get_full_sipshin

    hapgeo = detect_hapgeo(saju)
    chains = detect_sunsaeng_chain(saju)
    sipshin = get_full_sipshin(saju)

    dfws = {
        'dfw1': generate_dfw1(hapgeo),
        'dfw2': generate_dfw2(chains),
        'dfw3': generate_dfw3(sipshin['counts']),
    }

    dfws['total_count'] = len(dfws['dfw1']) + len(dfws['dfw2']) + len(dfws['dfw3'])
    dfws['summary'] = []
    for d in dfws['dfw1']:
        dfws['summary'].append(f"DFW-1: {d['label']} → 트리거: {d['trigger']}")
    for d in dfws['dfw2']:
        dfws['summary'].append(f"DFW-2: {d['label']} → 트리거: {d['trigger']}")
    for d in dfws['dfw3']:
        dfws['summary'].append(f"DFW-3: {d['label']} → 트리거: {d['trigger']}")

    return dfws
