// Family configuration — 하드코딩 대신 이 파일에서 관리
// 민감 정보이므로 환경변수로 override 가능

export interface FamilyMember {
  name: string
  birthday: Date
}

// Append KST offset to bare date strings so getMonth()/getDate() return
// correct Korean local date values (UTC midnight would shift the date by -9h).
function parseKstDate(envValue: string | undefined, fallback: string): Date {
  const raw = envValue || fallback
  // If value already contains time/timezone info, use as-is
  if (raw.includes('T') || raw.includes('+') || raw.includes('Z')) {
    return new Date(raw)
  }
  // Bare date like "1994-10-28" — anchor to KST midnight
  return new Date(`${raw}T00:00:00+09:00`)
}

export const FAMILY: Record<string, FamilyMember> = {
  wife: {
    name: '와이프',
    birthday: parseKstDate(process.env.FAMILY_WIFE_BIRTHDAY, '1994-10-28'),
  },
  child1: {
    name: '첫째',
    birthday: parseKstDate(process.env.FAMILY_CHILD1_BIRTHDAY, '2024-07-14'),
  },
  child2: {
    name: '둘째',
    birthday: parseKstDate(process.env.FAMILY_CHILD2_BIRTHDAY, '2025-08-01'),
  },
}
