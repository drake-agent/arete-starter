'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useGoals } from '@/hooks/useGoals'
import { useProjects } from '@/hooks/useProjects'
import { useNotes } from '@/hooks/useNotes'
import { DDayBadge } from '@/components/tasks/DDayBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ArrowLeft,
  Target,
  FolderKanban,
  StickyNote,
  RotateCcw,
} from 'lucide-react'
import type { Area, Routine } from '@/types'

export default function AreaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: area, isLoading } = useQuery({
    queryKey: ['areas', id],
    queryFn: async (): Promise<Area> => {
      const res = await fetch(`/api/areas/${id}`)
      return res.json()
    },
  })

  const { data: goals = [] } = useGoals()
  const { data: projects = [] } = useProjects()
  const { data: notes = [] } = useNotes(undefined, id)
  const { data: routines = [] } = useQuery({
    queryKey: ['routines'],
    queryFn: async (): Promise<Routine[]> => {
      const res = await fetch('/api/routines')
      return res.json()
    },
  })

  const areaGoals = goals.filter(g => g.area_id === id)
  const areaProjects = projects.filter(p => areaGoals.some(g => g.linked_projects?.includes(p.id)) || p.goal_id && areaGoals.some(g => g.id === p.goal_id))
  const areaRoutines = routines.filter(r => r.area_id === id || r.goal_id && areaGoals.some(g => g.id === r.goal_id))

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card rounded-lg animate-pulse" />)}
      </div>
    )
  }

  if (!area) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12 text-muted-foreground">
        영역을 찾을 수 없습니다
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/areas" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> 영역 목록
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-3xl">{area.icon}</span>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{area.title}</h1>
          <p className="text-sm text-muted-foreground">
            목표 {areaGoals.length} · 프로젝트 {areaProjects.length} · 루틴 {areaRoutines.length} · 노트 {notes.length}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Goals */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">목표</h2>
            <Badge variant="outline" className="text-[10px]">{areaGoals.length}</Badge>
          </div>
          {areaGoals.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-6">연결된 목표가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {areaGoals.map(goal => {
                const progress = goal.target_value && goal.current_value !== undefined
                  ? Math.round(((goal.current_value ?? 0) / goal.target_value) * 100)
                  : null
                return (
                  <Link key={goal.id} href={`/goals/${goal.id}`}>
                    <Card className="hover:border-primary/30 transition-colors">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: goal.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{goal.title}</span>
                              <Badge variant="outline" className="text-[10px]">{goal.status}</Badge>
                            </div>
                            {progress !== null && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <Progress value={progress} className="h-1.5 flex-1" />
                                <span className="text-[10px] text-muted-foreground tabular-nums">{progress}%</span>
                              </div>
                            )}
                          </div>
                          {goal.due_date && <DDayBadge dueDate={goal.due_date} />}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Projects */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <FolderKanban className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">프로젝트</h2>
            <Badge variant="outline" className="text-[10px]">{areaProjects.length}</Badge>
          </div>
          {areaProjects.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-6">연결된 프로젝트가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {areaProjects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:border-primary/30 transition-colors">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                        <span className="text-sm font-medium truncate flex-1">{project.title}</span>
                        <Badge variant="outline" className="text-[10px]">{project.status}</Badge>
                        {project.due_date && <DDayBadge dueDate={project.due_date} />}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Routines */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">루틴</h2>
            <Badge variant="outline" className="text-[10px]">{areaRoutines.length}</Badge>
          </div>
          {areaRoutines.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-6">연결된 루틴이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {areaRoutines.map(routine => (
                <Card key={routine.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <RotateCcw className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate flex-1">{routine.title}</span>
                      {routine.streak > 0 && (
                        <Badge variant="outline" className="text-[10px]">🔥 {routine.streak}일</Badge>
                      )}
                      <Badge variant={routine.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {routine.is_active ? '활성' : '중단'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Notes */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">노트</h2>
            <Badge variant="outline" className="text-[10px]">{notes.length}</Badge>
          </div>
          {notes.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-6">연결된 노트가 없습니다</p>
          ) : (
            <div className="space-y-2">
              {notes.map((note: { id: string; title: string; type: string; priority: number }) => (
                <Card key={note.id}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <StickyNote className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate flex-1">{note.title}</span>
                      <Badge variant="outline" className="text-[10px]">P{note.priority}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{note.type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
