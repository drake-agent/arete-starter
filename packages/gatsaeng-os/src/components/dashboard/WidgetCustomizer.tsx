'use client'

import { useState } from 'react'
import { useDashboardStore } from '@/stores/dashboardStore'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Settings2, GripVertical } from 'lucide-react'
import type { WidgetId } from '@/types'

const WIDGET_INFO: Partial<Record<WidgetId, { label: string; description: string }>> = {
  routine: { label: '루틴 체크리스트', description: '오늘의 습관 체인' },
  goals: { label: '목표 링', description: '목표별 진행률 링 차트' },
  heatmap: { label: '활동 히트맵', description: '일간 활동 기록' },
  timer: { label: '포커스 타이머', description: '집중 세션 타이머' },
  zeigarnik: { label: 'Zeigarnik 패널', description: '미완료 항목 알림 바' },
  energy: { label: '에너지 트래커', description: '시간대별 에너지 기록' },
  kanban: { label: '퀵 칸반', description: '태스크 칸반 미니뷰' },
  dday: { label: 'D-day 현황', description: '마일스톤 D-day 카운터' },
  proactive: { label: '코칭 알림', description: '사주 + 갓생 패턴 감지 알림' },
}

export function WidgetCustomizer() {
  const { activeWidgets, toggleWidget, reorderWidgets } = useDashboardStore()
  const [open, setOpen] = useState(false)
  const [dragItem, setDragItem] = useState<number | null>(null)

  const allWidgets: WidgetId[] = ['proactive', 'zeigarnik', 'routine', 'goals', 'timer', 'energy', 'heatmap', 'kanban', 'dday']

  const handleDragStart = (index: number) => {
    setDragItem(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragItem === null || dragItem === index) return

    const newOrder = [...activeWidgets]
    const [removed] = newOrder.splice(dragItem, 1)
    newOrder.splice(index, 0, removed)
    reorderWidgets(newOrder)
    setDragItem(index)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">커스터마이즈</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>위젯 설정</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-1">
          <p className="text-xs text-muted-foreground mb-3">위젯을 켜고/끄거나 드래그하여 순서를 변경하세요</p>

          {allWidgets.map((widgetId, index) => {
            const info = WIDGET_INFO[widgetId]
            const isActive = activeWidgets.includes(widgetId)
            const activeIndex = activeWidgets.indexOf(widgetId)

            return (
              <div
                key={widgetId}
                draggable={isActive}
                onDragStart={() => isActive && handleDragStart(activeIndex)}
                onDragOver={(e) => isActive && handleDragOver(e, activeIndex)}
                onDragEnd={() => setDragItem(null)}
                className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                  isActive ? 'bg-card' : 'opacity-60'
                } ${dragItem === activeIndex ? 'opacity-50' : ''}`}
              >
                {isActive && (
                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab flex-shrink-0" />
                )}
                {!isActive && <div className="w-3.5" />}
                <Checkbox
                  checked={isActive}
                  onCheckedChange={() => toggleWidget(widgetId)}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{info?.label}</div>
                  <div className="text-[10px] text-muted-foreground">{info?.description}</div>
                </div>
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
