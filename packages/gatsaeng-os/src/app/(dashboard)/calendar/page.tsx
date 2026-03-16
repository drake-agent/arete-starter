'use client'

import { useState, useMemo } from 'react'
import { useCalendarEvents, useCreateCalendarEvent, useDeleteCalendarEvent } from '@/hooks/useCalendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Trash2, Clock, MapPin } from 'lucide-react'
import type { CalendarEvent, CalendarCategory } from '@/types'

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

const CATEGORY_COLORS: Record<CalendarCategory, string> = {
  work: 'bg-primary/20 text-primary border-primary/30',
  personal: 'bg-gatsaeng-amber/20 text-gatsaeng-amber border-gatsaeng-amber/30',
  health: 'bg-gatsaeng-teal/20 text-gatsaeng-teal border-gatsaeng-teal/30',
  study: 'bg-gatsaeng-purple/20 text-gatsaeng-purple border-gatsaeng-purple/30',
  social: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  other: 'bg-muted text-muted-foreground border-border',
}

const CATEGORY_LABELS: Record<CalendarCategory, string> = {
  work: '업무',
  personal: '개인',
  health: '건강',
  study: '학습',
  social: '사교',
  other: '기타',
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekDates(baseDate: Date) {
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7 // Monday=0
  const dates: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) dates.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) dates.push(new Date(year, month, d))
  while (dates.length % 7 !== 0) dates.push(null)
  return dates
}

function EventCard({ event, onDelete }: { event: CalendarEvent; onDelete: (id: string) => void }) {
  return (
    <div
      className={`rounded px-1.5 py-1 text-[10px] leading-tight border group relative ${
        CATEGORY_COLORS[event.category ?? 'other']
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="font-medium truncate">{event.title}</div>
      {event.time_start && (
        <div className="flex items-center gap-0.5 opacity-70">
          <Clock className="w-2.5 h-2.5" />
          {event.time_start}{event.time_end ? `–${event.time_end}` : ''}
        </div>
      )}
      {event.location && (
        <div className="flex items-center gap-0.5 opacity-70">
          <MapPin className="w-2.5 h-2.5" />
          <span className="truncate">{event.location}</span>
        </div>
      )}
      <button
        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(event.id)}
      >
        <Trash2 className="w-3 h-3 text-gatsaeng-red" />
      </button>
    </div>
  )
}

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const createEvent = useCreateCalendarEvent()
  const deleteEvent = useDeleteCalendarEvent()
  const today = formatDate(new Date())

  // Week view dates
  const weekBase = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])
  const weekDates = useMemo(() => getWeekDates(weekBase), [weekBase])

  // Month view dates
  const monthDate = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])
  const monthGrid = useMemo(() => getMonthGrid(monthDate.getFullYear(), monthDate.getMonth()), [monthDate])

  // Calculate range for query
  const rangeStart = useMemo(() => {
    if (viewMode === 'week') return formatDate(weekDates[0])
    const first = monthGrid.find(d => d !== null)
    return first ? formatDate(first) : formatDate(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1))
  }, [viewMode, weekDates, monthGrid, monthDate])

  const rangeEnd = useMemo(() => {
    if (viewMode === 'week') return formatDate(weekDates[6])
    const nonNull = monthGrid.filter((d): d is Date => d !== null)
    const last = nonNull[nonNull.length - 1]
    return last ? formatDate(last) : formatDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0))
  }, [viewMode, weekDates, monthGrid, monthDate])

  const { data: events = [], isLoading } = useCalendarEvents(rangeStart, rangeEnd)

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const e of events) {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    }
    return map
  }, [events])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await createEvent.mutateAsync({
      title: form.get('title') as string,
      date: (form.get('date') as string) || selectedDate || today,
      time_start: (form.get('time_start') as string) || undefined,
      time_end: (form.get('time_end') as string) || undefined,
      category: (form.get('category') as CalendarCategory) || 'other',
      location: (form.get('location') as string) || undefined,
      description: (form.get('description') as string) || undefined,
      all_day: !(form.get('time_start') as string),
      created_by: 'user',
    })
    setOpen(false)
    setSelectedDate(null)
  }

  const handleDelete = (id: string) => {
    if (!confirm('이 일정을 삭제하시겠습니까?')) return
    deleteEvent.mutate(id)
  }

  const handlePrev = () => viewMode === 'week' ? setWeekOffset(w => w - 1) : setMonthOffset(m => m - 1)
  const handleNext = () => viewMode === 'week' ? setWeekOffset(w => w + 1) : setMonthOffset(m => m + 1)
  const handleToday = () => { setWeekOffset(0); setMonthOffset(0) }

  const navLabel = viewMode === 'week'
    ? `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()} — ${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`
    : `${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`

  const showTodayBtn = viewMode === 'week' ? weekOffset !== 0 : monthOffset !== 0

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">캘린더</h1>
          <p className="text-sm text-muted-foreground mt-1">일정 관리</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'month')}>
            <TabsList>
              <TabsTrigger value="week">주간</TabsTrigger>
              <TabsTrigger value="month">월간</TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black">
                <Plus className="w-4 h-4 mr-2" /> 일정 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>일정 추가</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>제목</Label>
                  <Input name="title" required placeholder="일정 제목" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>날짜</Label>
                    <Input name="date" type="date" defaultValue={selectedDate || today} />
                  </div>
                  <div>
                    <Label>카테고리</Label>
                    <Select name="category" defaultValue="other">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(CATEGORY_LABELS) as CalendarCategory[]).map(cat => (
                          <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>시작 시간</Label>
                    <Input name="time_start" type="time" />
                  </div>
                  <div>
                    <Label>종료 시간</Label>
                    <Input name="time_end" type="time" />
                  </div>
                </div>
                <div>
                  <Label>장소</Label>
                  <Input name="location" placeholder="장소 (선택)" />
                </div>
                <div>
                  <Label>메모</Label>
                  <Input name="description" placeholder="메모 (선택)" />
                </div>
                <Button type="submit" className="w-full bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black">
                  추가
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handlePrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{navLabel}</span>
          {showTodayBtn && (
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={handleToday}>
              오늘
            </Button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: viewMode === 'week' ? 7 : 35 }, (_, i) => (
            <div key={i} className={`${viewMode === 'week' ? 'h-40' : 'h-24'} bg-card rounded-lg animate-pulse`} />
          ))}
        </div>
      ) : viewMode === 'week' ? (
        /* Weekly view */
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dateStr = formatDate(date)
            const dayEvents = eventsByDate[dateStr] || []
            const isToday = dateStr === today
            const isWeekend = i >= 5

            return (
              <div
                key={dateStr}
                className={`min-h-[160px] rounded-lg border p-2 transition-colors cursor-pointer hover:border-primary/50 ${
                  isToday ? 'border-gatsaeng-amber/50 bg-gatsaeng-amber/5' : 'border-border bg-card'
                }`}
                onClick={() => { setSelectedDate(dateStr); setOpen(true) }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${isWeekend ? 'text-gatsaeng-red' : 'text-muted-foreground'}`}>
                    {DAY_NAMES[date.getDay()]}
                  </span>
                  <span className={`text-sm font-bold ${isToday ? 'text-gatsaeng-amber' : 'text-foreground'}`}>
                    {date.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayEvents.map(event => (
                    <EventCard key={event.id} event={event} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Monthly view */
        <>
          <div className="grid grid-cols-7 gap-px mb-1">
            {['월', '화', '수', '목', '금', '토', '일'].map(d => (
              <div key={d} className={`text-center text-[10px] font-medium py-1 ${
                d === '토' || d === '일' ? 'text-gatsaeng-red' : 'text-muted-foreground'
              }`}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="min-h-[90px]" />
              const dateStr = formatDate(date)
              const dayEvents = eventsByDate[dateStr] || []
              const isToday = dateStr === today
              const dayOfWeek = (i % 7)
              const isWeekend = dayOfWeek >= 5

              return (
                <div
                  key={dateStr}
                  className={`min-h-[90px] rounded-md border p-1 transition-colors cursor-pointer hover:border-primary/50 ${
                    isToday ? 'border-gatsaeng-amber/50 bg-gatsaeng-amber/5' : 'border-border/50 bg-card'
                  }`}
                  onClick={() => { setSelectedDate(dateStr); setOpen(true) }}
                >
                  <div className={`text-xs font-bold mb-1 ${
                    isToday ? 'text-gatsaeng-amber' : isWeekend ? 'text-gatsaeng-red/70' : 'text-foreground'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={`rounded px-1 py-0.5 text-[9px] leading-tight truncate border ${
                          CATEGORY_COLORS[event.category ?? 'other']
                        }`}
                        onClick={(e) => e.stopPropagation()}
                        title={`${event.title}${event.time_start ? ` ${event.time_start}` : ''}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-muted-foreground pl-1">+{dayEvents.length - 3}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Legend */}
      <div className="flex gap-3 mt-4 flex-wrap">
        {(Object.keys(CATEGORY_LABELS) as CalendarCategory[]).map(cat => (
          <div key={cat} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${CATEGORY_COLORS[cat].split(' ')[0]}`} />
            <span className="text-[10px] text-muted-foreground">{CATEGORY_LABELS[cat]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
