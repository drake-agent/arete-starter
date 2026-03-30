'use client'

import { useState } from 'react'
import { useAreas, useCreateArea, useDeleteArea } from '@/hooks/useAreas'
import { useGoals } from '@/hooks/useGoals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Target, Layers, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { Area } from '@/types'

const AREA_ICONS = ['💪', '💼', '📈', '🧠', '🎨', '❤️', '🌱', '📚']

export default function AreasPage() {
  const { data: areas = [], isLoading } = useAreas()
  const { data: goals = [] } = useGoals()
  const createArea = useCreateArea()
  const deleteArea = useDeleteArea()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('💪')

  const handleCreate = () => {
    if (!title.trim() || createArea.isPending) return
    createArea.mutate(
      { title: title.trim(), icon, status: 'active', linked_goals: [] },
      { onSuccess: () => { setOpen(false); setTitle(''); setIcon('💪') } }
    )
  }

  const activeGoals = (areaId: string) =>
    goals.filter(g => g.area_id === areaId && g.status === 'active')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6" />
            영역 (Areas)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            인생의 핵심 영역을 관리합니다
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> 영역 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 영역 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm text-muted-foreground">아이콘</label>
                <div className="flex gap-2 mt-1">
                  {AREA_ICONS.map(i => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`w-10 h-10 rounded-sm text-xl flex items-center justify-center transition-colors ${
                        icon === i ? 'bg-primary/20 ring-2 ring-primary' : 'bg-card hover:bg-muted'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">영역 이름</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="예: 건강/커리어/마케팅"
                  className="mt-1"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <Button onClick={handleCreate} disabled={!title.trim() || createArea.isPending} className="w-full">
                추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card rounded-sm animate-pulse" />)}
        </div>
      ) : areas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            아직 영역이 없습니다. 인생의 핵심 영역을 추가해보세요.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {areas.map(area => {
            const linkedGoals = activeGoals(area.id)
            return (
              <Link key={area.id} href={`/areas/${area.id}`}>
              <Card className="group hover:border-primary/30 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{area.icon}</span>
                      <span className="text-lg">{area.title}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-gatsaeng-red"
                        onClick={(e) => { e.preventDefault(); deleteArea.mutate(area.id) }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <Target className="w-3 h-3" />
                    연결된 목표 {linkedGoals.length}개
                  </div>
                  {linkedGoals.length > 0 ? (
                    <div className="space-y-2">
                      {linkedGoals.map(g => (
                        <Link key={g.id} href={`/goals/${g.id}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                          <span className="truncate">{g.title}</span>
                          {g.target_value && g.current_value !== undefined && (
                            <Badge variant="outline" className="ml-auto text-[10px]">
                              {Math.round(((g.current_value ?? 0) / g.target_value) * 100)}%
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">연결된 목표가 없습니다.</p>
                  )}
                </CardContent>
              </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
