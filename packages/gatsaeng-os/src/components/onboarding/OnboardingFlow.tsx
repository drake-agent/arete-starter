'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronRight, ChevronLeft, Sparkles, Target, Brain, Clock, Rocket } from 'lucide-react'

interface OnboardingData {
  display_name: string
  identity: string
  core_value: string
  peak_hours: string
  first_goal: string
}

const STEPS = [
  { icon: Sparkles, title: '환영합니다!', subtitle: '갓생 OS에 오신 것을 환영합니다' },
  { icon: Brain, title: '정체성', subtitle: '어떤 사람이 되고 싶으세요?' },
  { icon: Target, title: '핵심 가치', subtitle: '당신의 핵심 가치는?' },
  { icon: Clock, title: '피크 타임', subtitle: '가장 에너지가 높은 시간대는?' },
  { icon: Rocket, title: '첫 목표', subtitle: '시작할 첫 번째 목표를 정해보세요' },
]

const CORE_VALUES = ['성장', '자유', '관계', '건강', '재미', '안정', '창의']

const PEAK_HOURS = [
  { label: '새벽형 (5-8시)', value: 'early' },
  { label: '오전형 (9-12시)', value: 'morning' },
  { label: '오후형 (13-17시)', value: 'afternoon' },
  { label: '야간형 (22-2시)', value: 'night' },
]

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    display_name: '',
    identity: '',
    core_value: '',
    peak_hours: '',
    first_goal: '',
  })

  const update = (key: keyof OnboardingData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const canProceed = () => {
    switch (step) {
      case 0: return data.display_name.trim().length > 0
      case 1: return data.identity.trim().length > 0
      case 2: return data.core_value.length > 0
      case 3: return data.peak_hours.length > 0
      case 4: return data.first_goal.trim().length > 0
      default: return false
    }
  }

  const StepIcon = STEPS[step].icon

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-gatsaeng-amber' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <Card className="border-border/50">
          <CardContent className="py-8 px-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gatsaeng-amber/10 flex items-center justify-center">
                <StepIcon className="w-5 h-5 text-gatsaeng-amber" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">{STEPS[step].title}</h2>
                <p className="text-xs text-muted-foreground">{STEPS[step].subtitle}</p>
              </div>
            </div>

            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <Label>이름 또는 닉네임</Label>
                  <Input
                    value={data.display_name}
                    onChange={e => update('display_name', e.target.value)}
                    placeholder="Drake"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  뇌과학 기반 습관 시스템으로 갓생을 시작합니다. 5단계 설정을 완료하면 대시보드가 열립니다.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label>나는 _____ 사람이다</Label>
                  <Input
                    value={data.identity}
                    onChange={e => update('identity', e.target.value)}
                    placeholder="매일 성장하는"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Identity-based habits: 행동이 아닌 정체성에서 시작하면 습관이 오래 갑니다. (James Clear)
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Label>당신의 핵심 가치를 선택하세요</Label>
                <div className="grid grid-cols-4 gap-2">
                  {CORE_VALUES.map(value => (
                    <button
                      key={value}
                      onClick={() => update('core_value', value)}
                      className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                        data.core_value === value
                          ? 'bg-gatsaeng-amber text-black'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <Label>가장 집중이 잘 되는 시간대는?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PEAK_HOURS.map(ph => (
                    <button
                      key={ph.value}
                      onClick={() => update('peak_hours', ph.value)}
                      className={`px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                        data.peak_hours === ph.value
                          ? 'bg-gatsaeng-purple text-white'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {ph.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ultradian rhythm: 에너지 패턴을 파악하면 최적의 작업 배치가 가능합니다.
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <Label>첫 목표를 입력하세요</Label>
                  <Input
                    value={data.first_goal}
                    onChange={e => update('first_goal', e.target.value)}
                    placeholder="영어 비즈니스 레벨 달성"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  대시보드에서 목표 진행률과 Why Statement를 확인할 수 있습니다.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                </Button>
              ) : <div />}

              {step < STEPS.length - 1 ? (
                <Button
                  size="sm"
                  disabled={!canProceed()}
                  onClick={() => setStep(s => s + 1)}
                  className="bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black"
                >
                  다음 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={!canProceed()}
                  onClick={() => onComplete(data)}
                  className="bg-gatsaeng-teal hover:bg-gatsaeng-teal/80 text-black"
                >
                  <Rocket className="w-4 h-4 mr-1" /> 갓생 시작!
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  )
}
