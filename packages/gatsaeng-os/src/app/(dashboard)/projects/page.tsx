'use client'

import { useState } from 'react'
import { useProjects, useTasks, useCreateProject, useUpdateProject } from '@/hooks/useProjects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { DDayBadge } from '@/components/tasks/DDayBadge'
import { FolderKanban, Plus, Archive, CheckCircle2 } from 'lucide-react'
import { useGoals } from '@/hooks/useGoals'
import Link from 'next/link'
import type { ViewType, GoalStatus } from '@/types'

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const { data: goals } = useGoals()
  const { data: allTasks = [] } = useTasks()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<string>('active')

  const activeProjects = (projects ?? []).filter(p => p.status === 'active')
  const completedProjects = (projects ?? []).filter(p => p.status === 'completed')
  const archivedProjects = (projects ?? []).filter(p => p.status === 'archived')
  const displayProjects = tab === 'active' ? activeProjects
    : tab === 'completed' ? completedProjects
    : archivedProjects

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await createProject.mutateAsync({
      title: form.get('title') as string,
      description: (form.get('description') as string) || undefined,
      default_view: (form.get('default_view') as ViewType) || 'kanban',
      goal_id: (form.get('goal_id') as string) || undefined,
      color: (form.get('color') as string) || '#58a6ff',
    })
    setOpen(false)
  }

  const handleStatusChange = (id: string, status: GoalStatus) => {
    updateProject.mutate({ id, status })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">프로젝트</h1>
          <p className="text-sm text-muted-foreground mt-1">프로젝트별 태스크 관리</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black">
              <Plus className="w-4 h-4 mr-2" /> 프로젝트 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>프로젝트 만들기</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>프로젝트 이름</Label>
                <Input name="title" required placeholder="갓생 OS 개발" />
              </div>
              <div>
                <Label>설명</Label>
                <Input name="description" placeholder="프로젝트 설명 (선택)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>기본 뷰</Label>
                  <Select name="default_view" defaultValue="kanban">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kanban">Kanban</SelectItem>
                      <SelectItem value="table">Table</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>컬러</Label>
                  <Input name="color" type="color" defaultValue="#58a6ff" className="h-9" />
                </div>
              </div>
              {(goals ?? []).length > 0 && (
                <div>
                  <Label>연결 목표</Label>
                  <Select name="goal_id">
                    <SelectTrigger><SelectValue placeholder="목표 선택 (선택)" /></SelectTrigger>
                    <SelectContent>
                      {(goals ?? []).map(goal => (
                        <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black">
                프로젝트 생성
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="active">진행 중 ({activeProjects.length})</TabsTrigger>
          <TabsTrigger value="completed">완료 ({completedProjects.length})</TabsTrigger>
          <TabsTrigger value="archived">보관 ({archivedProjects.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-card rounded-sm animate-pulse" />)}
        </div>
      ) : displayProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {tab === 'active' ? '진행 중인 프로젝트가 없습니다' : tab === 'completed' ? '완료된 프로젝트가 없습니다' : '보관된 프로젝트가 없습니다'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayProjects.map(project => {
            const projectTasks = allTasks.filter(t => t.project_id === project.id)
            const totalTasks = projectTasks.length
            const doneTasks = projectTasks.filter(t => t.status === 'done').length
            const pendingTasks = totalTasks - doneTasks
            const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
            return (
            <Card key={project.id} className="hover:border-primary/50 transition-colors group relative">
              <Link href={`/projects/${project.id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderKanban className="w-4 h-4" style={{ color: project.color }} />
                    <span className="truncate">{project.title}</span>
                    {project.due_date && <DDayBadge dueDate={project.due_date} className="ml-auto" />}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-2 truncate">{project.description}</p>
                  )}
                  {totalTasks > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{pendingTasks}개 남음 · {doneTasks}개 완료</span>
                        <span className="tabular-nums font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Badge variant="outline">{project.default_view}</Badge>
                    {totalTasks === 0 && (
                      <Badge variant="outline" className="text-muted-foreground">AWAITING INPUT</Badge>
                    )}
                  </div>
                </CardContent>
              </Link>
              {/* Status change buttons */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {tab === 'active' && (
                  <>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-gatsaeng-teal"
                      title="완료로 이동"
                      onClick={(e) => { e.preventDefault(); handleStatusChange(project.id, 'completed') }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="보관으로 이동"
                      onClick={(e) => { e.preventDefault(); handleStatusChange(project.id, 'archived') }}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {(tab === 'completed' || tab === 'archived') && (
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    title="다시 활성화"
                    onClick={(e) => { e.preventDefault(); handleStatusChange(project.id, 'active') }}
                  >
                    <FolderKanban className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
