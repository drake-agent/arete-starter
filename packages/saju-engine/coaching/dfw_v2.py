#!/usr/bin/env python3
"""
DFW v2 — @orrery/core 결과 기반 의사결정 프레임워크 동적 생성

manseryeok_v2.SajuResult를 입력받아 DFW-1/2/3을 자동 생성.
"""

from ..core.manseryeok_v2 import SajuResult

# ── 천간합 쌍 ──────────────────────────────────────────────────

천간합_쌍 = [('甲', '己'), ('乙', '庚'), ('丙', '辛'), ('丁', '壬'), ('戊', '癸')]

# 십신 한자→한글 매핑
SIPSIN_KR = {
    '比肩': '비견', '劫財': '겁재',
    '食神': '식신', '傷官': '상관',
    '偏財': '편재', '正財': '정재',
    '偏官': '편관', '正官': '정관',
    '偏印': '편인', '正印': '정인',
    '本元': '일간',
}

# 십신 대분류
SIPSIN_CATEGORY = {
    '비견': '비겁', '겁재': '비겁',
    '식신': '식상', '상관': '식상',
    '편재': '재성', '정재': '재성',
    '편관': '관성', '정관': '관성',
    '편인': '인성', '정인': '인성',
}


# ── 합거 감지 ──────────────────────────────────────────────────

def detect_hapgeo(saju: SajuResult) -> list:
    """원국 4천간에서 천간합 감지. @orrery/core relations도 참조."""
    ilgan = saju.ilgan
    stems = [p.stem for p in saju.pillars]

    # @orrery/core의 relations에서 천간합 찾기
    orrery_haps = []
    for rel in saju.relations:
        if isinstance(rel, dict) and '合' in str(rel.get('type', '')):
            orrery_haps.append(rel)

    # 직접 감지 (보완)
    results = []
    for a, b in 천간합_쌍:
        if a in stems and b in stems:
            # 합 상대가 일간에게 어떤 십성인지 판단
            if a == ilgan:
                partner = b
                partner_pillar = next((p for p in saju.pillars if p.stem == b and p.position != 'day'), None)
            elif b == ilgan:
                partner = a
                partner_pillar = next((p for p in saju.pillars if p.stem == a and p.position != 'day'), None)
            else:
                # 간접 합거
                p_a = next((p for p in saju.pillars if p.stem == a), None)
                p_b = next((p for p in saju.pillars if p.stem == b), None)
                ss_a = SIPSIN_KR.get(p_a.stem_sipsin, '') if p_a else ''
                ss_b = SIPSIN_KR.get(p_b.stem_sipsin, '') if p_b else ''
                results.append({
                    'pair': f'{a}{b}',
                    'type': '간접합거',
                    'impact': f'{ss_a}과 {ss_b}이 묶여서 둘 다 약화',
                })
                continue

            if partner_pillar:
                sipsin = SIPSIN_KR.get(partner_pillar.stem_sipsin, '불명')
            else:
                sipsin = '불명'

            results.append({
                'pair': f'{a}{b}',
                'type': '직접합거',
                'target_sipshin': sipsin,
                'direction': _get_direction(sipsin),
            })

    return results


def _get_direction(sipsin: str) -> str:
    매핑 = {
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
    return 매핑.get(sipsin, '불명')


# ── DFW-1 생성 ──────────────────────────────────────────────────

def generate_dfw1(hapgeo_list: list) -> list:
    dfw1_sets = []
    for hap in hapgeo_list:
        if hap['type'] == '간접합거':
            continue

        sipsin = hap.get('target_sipshin', '')
        cat = SIPSIN_CATEGORY.get(sipsin, '')

        if cat == '재성':
            questions = [
                '이건 돈/기회가 끌고 가는 결정인가, 축적(시스템/학습)이 끌고 가는 결정인가?',
                '6개월 뒤 시스템 자산(IP/데이터/프로세스)이 늘어나는가?',
                '안 하면 뭘 잃는가? 일회성 기회인가, 반복 구조인가?',
            ]
            delay, trigger = '72시간', '새 돈 기회/투자/사업 제안이 왔을 때'
        elif cat == '관성':
            questions = [
                '이건 의무감이 끌고 가는 결정인가, 내 방향이 끌고 가는 결정인가?',
                '이걸 하면 내 구조가 강해지는가, 남의 구조를 떠받치는가?',
                '안 하면 실제로 무너지는 게 있는가?',
            ]
            delay, trigger = '48시간', '책임/의무/요청이 들어올 때'
        elif cat == '식상':
            questions = [
                '이건 만들고 싶어서인가, 만들어야 할 것 같아서인가?',
                '이 산출물이 시장 가치로 전환 가능한가?',
                '기존 프로젝트를 마무리하고도 여력이 있는가?',
            ]
            delay, trigger = '48시간', '새 프로젝트/작품/콘텐츠를 시작하려 할 때'
        elif cat == '인성':
            questions = [
                '이건 배우면 바로 쓸 수 있는 건가, 배우는 것 자체가 목적인가?',
                '지금 부족한 건 지식인가, 실행인가?',
                '이 학습이 3개월 내 산출물로 이어지는가?',
            ]
            delay, trigger = '24시간', '새 공부/자격증/강의를 시작하려 할 때'
        elif cat == '비겁':
            questions = [
                '이건 나만의 길인가, 남과 비교해서 생긴 욕구인가?',
                '혼자 해야 하는 이유가 진짜 있는가?',
                '파트너/시스템에 맡기면 안 되는가?',
            ]
            delay, trigger = '24시간', '경쟁심/비교에서 결정을 내리려 할 때'
        else:
            questions = ['이 결정의 진짜 동기는 무엇인가?']
            delay, trigger = '24시간', '큰 결정 전'

        dfw1_sets.append({
            'name': 'DFW-1',
            'label': f'합거 탈출 필터 ({hap["pair"]}합)',
            'pair': hap['pair'],
            'target_sipshin': sipsin,
            'direction': hap.get('direction', ''),
            'trigger': trigger,
            'delay': delay,
            'questions': questions,
        })

    return dfw1_sets


# ── DFW-2: 순생 체인 병목 ──────────────────────────────────────

def detect_chains(saju: SajuResult) -> list:
    counts = saju.sipsin_counts
    chains = []

    if counts['식상'] >= 1 and counts['재성'] >= 1:
        flow = '만든다→교환한다'
        name = '식상생재'
        if counts['관성'] >= 1:
            flow = '만든다→교환한다→구조화한다'
            name = '식상생재생관'
        chains.append({'name': name, 'flow': flow})

    if counts['재성'] >= 1 and counts['관성'] >= 1:
        flow = '교환한다→구조화한다'
        name = '재생관'
        if counts['인성'] >= 1:
            flow += '→학습한다'
            name = '재생관생인'
        chains.append({'name': name, 'flow': flow})

    if counts['관성'] >= 1 and counts['인성'] >= 1:
        flow = '구조화한다→학습한다'
        name = '관인상생'
        if counts['비겁'] >= 1:
            flow += '→독립한다'
            name = '관인생비'
        chains.append({'name': name, 'flow': flow})

    if counts['인성'] >= 1 and counts['비겁'] >= 1:
        flow = '학습한다→독립한다'
        name = '인비상생'
        if counts['식상'] >= 1:
            flow += '→만든다'
            name = '인비생식'
        chains.append({'name': name, 'flow': flow})

    return chains


def generate_dfw2(chains: list) -> list:
    병목_질문 = {
        '식상생재': [
            'Step 1: 아이디어/산출물이 나오고 있는가? → No면 에너지 고갈',
            'Step 2: 산출물이 시장 가치로 전환되고 있는가? → No면 전환 경로 재설계',
        ],
        '식상생재생관': [
            'Step 1: 아이디어/산출물이 나오고 있는가?',
            'Step 2: 산출물이 시장 가치로 전환되고 있는가?',
            'Step 3: 전환된 가치가 구조/시스템에 쌓이고 있는가? ← 보통 여기서 막힘',
        ],
        '재생관': [
            'Step 1: 돈/성과가 들어오고 있는가?',
            'Step 2: 그게 구조/시스템/조직으로 전환되고 있는가?',
        ],
        '재생관생인': [
            'Step 1: 돈/성과가 들어오고 있는가?',
            'Step 2: 구조/시스템이 학습/전문성으로 전환되고 있는가?',
        ],
        '관인상생': [
            'Step 1: 외부 구조(직장/조직)가 작동하고 있는가?',
            'Step 2: 거기서 학습/성장이 일어나고 있는가?',
        ],
        '관인생비': [
            'Step 1: 외부 구조에서 학습이 일어나는가?',
            'Step 2: 학습이 독립적 실행력으로 전환되는가?',
        ],
        '인비상생': [
            'Step 1: 학습/충전이 실행력으로 전환되고 있는가?',
        ],
        '인비생식': [
            'Step 1: 학습이 독립적 실행으로 전환되는가?',
            'Step 2: 실행이 산출물로 이어지는가?',
        ],
    }

    return [{
        'name': 'DFW-2',
        'label': f'순생 체인 병목 ({c["name"]})',
        'chain': c['name'],
        'flow': c['flow'],
        'trigger': '"바쁜데 뭔가 안 쌓인다" 체감이 올 때',
        'questions': 병목_질문.get(c['name'], [f'Step 1: {c["flow"]}의 첫 단계가 작동하는가?']),
    } for c in chains]


# ── DFW-3: 식상 과잉 ──────────────────────────────────────────

def generate_dfw3(saju: SajuResult) -> list:
    식상 = saju.sipsin_counts.get('식상', 0)
    if 식상 < 2:
        return []
    return [{
        'name': 'DFW-3',
        'label': f'식상 과잉 필터 (식상 {식상}개)',
        'trigger': '아이디어/프로젝트가 3개 이상 동시에 떠오를 때',
        'questions': [
            '72시간 후에도 살아남는 아이디어가 몇 개인가?',
            '기존 시스템에 장착 가능한가? → 불가능이면 새 시스템 필요 → 여력 확인',
            '동시 프로젝트가 2개 이하인가? → No면 대기열.',
        ],
        'reason': f'식상 {식상}개 — 분산되면 각각 임계치를 넘지 못함',
    }]


# ── 통합 ──────────────────────────────────────────────────────

def generate_all_dfws(saju: SajuResult) -> dict:
    hapgeo = detect_hapgeo(saju)
    chains = detect_chains(saju)

    dfws = {
        'dfw1': generate_dfw1(hapgeo),
        'dfw2': generate_dfw2(chains),
        'dfw3': generate_dfw3(saju),
        'hapgeo': hapgeo,
        'chains': chains,
    }
    dfws['total_count'] = len(dfws['dfw1']) + len(dfws['dfw2']) + len(dfws['dfw3'])
    dfws['summary'] = []
    for d in dfws['dfw1']:
        dfws['summary'].append(f"DFW-1: {d['label']} → {d['trigger']}")
    for d in dfws['dfw2']:
        dfws['summary'].append(f"DFW-2: {d['label']} → {d['trigger']}")
    for d in dfws['dfw3']:
        dfws['summary'].append(f"DFW-3: {d['label']} → {d['trigger']}")

    return dfws
