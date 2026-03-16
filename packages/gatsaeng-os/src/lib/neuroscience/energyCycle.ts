export function getEnergyRecommendation(
  currentHour: number,
  peakHours: number[],
  energyLogs: { hour: number; level: number }[]
): {
  level: 'high' | 'medium' | 'low'
  recommendation: string
  suggestedTaskType: string
} {
  const recentLogs = energyLogs
    .filter(l => l.hour === currentHour)
    .slice(-7)

  const avgEnergy = recentLogs.length
    ? recentLogs.reduce((sum, l) => sum + l.level, 0) / recentLogs.length
    : peakHours.includes(currentHour) ? 4 : 2.5

  if (avgEnergy >= 3.5) return {
    level: 'high',
    recommendation: '지금이 딥워크 골든타임입니다',
    suggestedTaskType: '창의적 작업 / 어려운 문제 해결',
  }

  if (avgEnergy >= 2.5) return {
    level: 'medium',
    recommendation: '집중력 유지 가능한 시간입니다',
    suggestedTaskType: '미팅 / 이메일 / 리뷰',
  }

  return {
    level: 'low',
    recommendation: '에너지 보충이 필요한 시간입니다',
    suggestedTaskType: '루틴 작업 / 행정 / 휴식',
  }
}
