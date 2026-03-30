export type CalendarCategory = 'work' | 'personal' | 'health' | 'study' | 'social' | 'other'

// Apple Calendar 이벤트의 제목/장소/캘린더명으로 카테고리 자동 추론
export function inferCategory(event: {
  title: string
  location?: string
  calendar: string
}): CalendarCategory {
  const t = (event.title || '').toLowerCase()
  const loc = (event.location || '').toLowerCase()
  const cal = (event.calendar || '').toLowerCase()

  // 건강
  if (/운동|헬스|gym|workout|pt |필라테스|요가|yoga|병원|의료|치과|검진|건강|health/i.test(t + loc))
    return 'health'

  // 학습
  if (/세미나|강의|교육|학습|study|workshop|course|lecture|training|reading|독서/i.test(t))
    return 'study'

  // 사교
  if (/저녁|dinner|lunch|점심|식사|모임|파티|party|골프|갈라|gala|와인|wine|네트워킹|networking|동창|친구|gathering/i.test(t))
    return 'social'

  // 개인
  if (/개인|personal|가족|아이|아기|병원|이사|은행|관공서/i.test(t)
    || cal === '집' || cal === 'home' || cal === 'personal')
    return 'personal'

  // 업무 (기본 — 회의, 미팅, 보고, Teams, 세션 등)
  if (/회의|미팅|meeting|보고|리뷰|review|스프린트|sprint|sync|standup|session|세션|팀|team|주간|월간|분기|weekly|monthly|quarterly|주주총회|이사회|전략|strategy|마케팅|영업|재무|프로세스|리더|leadership/i.test(t)
    || /microsoft teams|zoom|google meet|teams 모임/i.test(t + loc)
    || cal === '직장' || cal === 'work' || cal === '일정')
    return 'work'

  // 생일/기념일
  if (/생일|birthday|기념일|anniversary/i.test(t))
    return 'personal'

  // 공휴일
  if (/공휴일|holiday/i.test(t + cal))
    return 'other'

  // 기본값: 업무
  return 'work'
}
