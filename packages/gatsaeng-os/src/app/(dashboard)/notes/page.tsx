'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes'
import { useAreas } from '@/hooks/useAreas'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { StickyNote, FileText, BookOpen, Link2, Plus, Trash2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NoteType } from '@/types'

const TYPE_CONFIG: Record<NoteType, { label: string; icon: typeof StickyNote; color: string }> = {
  note: { label: '노트', icon: StickyNote, color: 'bg-primary/10 text-primary border-primary/30' },
  file: { label: '파일', icon: FileText, color: 'bg-gatsaeng-amber/10 text-gatsaeng-amber border-gatsaeng-amber/30' },
  reference: { label: '레퍼런스', icon: BookOpen, color: 'bg-gatsaeng-teal/10 text-gatsaeng-teal border-gatsaeng-teal/30' },
  link: { label: '링크', icon: Link2, color: 'bg-gatsaeng-purple/10 text-gatsaeng-purple border-gatsaeng-purple/30' },
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-gatsaeng-red text-white',
  2: 'bg-gatsaeng-amber text-black',
  3: 'bg-muted text-muted-foreground',
}

export default function NotesPage() {
  const [tab, setTab] = useState<string>('all')
  const [open, setOpen] = useState(false)
  const { data: notes = [], isLoading } = useNotes(tab === 'all' ? undefined : tab as NoteType)
  const { data: areas = [] } = useAreas()
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await createNote.mutateAsync({
      title: form.get('title') as string,
      type: (form.get('type') as NoteType) || 'note',
      priority: (Number(form.get('priority')) || 2) as 1 | 2 | 3,
      area_id: (form.get('area_id') as string) || undefined,
      url: (form.get('url') as string) || undefined,
      content: (form.get('content') as string) || undefined,
    })
    setOpen(false)
  }

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`"${title}" 노트를 삭제하시겠습니까?`)) return
    deleteNote.mutate(id)
  }

  const grouped = {
    note: notes.filter(n => n.type === 'note'),
    file: notes.filter(n => n.type === 'file'),
    reference: notes.filter(n => n.type === 'reference'),
    link: notes.filter(n => n.type === 'link'),
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">노트</h1>
          <p className="text-sm text-muted-foreground mt-1">노트, 파일, 레퍼런스, 링크 관리</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/80">
              <Plus className="w-4 h-4 mr-2" /> 노트 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>노트 추가</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>제목</Label>
                <Input name="title" required placeholder="노트 제목" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>유형</Label>
                  <Select name="type" defaultValue="note">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TYPE_CONFIG) as NoteType[]).map(t => (
                        <SelectItem key={t} value={t}>{TYPE_CONFIG[t].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>우선순위</Label>
                  <Select name="priority" defaultValue="2">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">P1 (높음)</SelectItem>
                      <SelectItem value="2">P2 (보통)</SelectItem>
                      <SelectItem value="3">P3 (낮음)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>영역 (선택)</Label>
                <Select name="area_id">
                  <SelectTrigger><SelectValue placeholder="없음" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">없음</SelectItem>
                    {areas.map((a: { id: string; title: string }) => (
                      <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>URL (링크/레퍼런스)</Label>
                <Input name="url" type="url" placeholder="https://..." />
              </div>
              <div>
                <Label>내용</Label>
                <textarea
                  name="content"
                  placeholder="마크다운 내용..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full">추가</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">전체 ({notes.length})</TabsTrigger>
          <TabsTrigger value="note">노트</TabsTrigger>
          <TabsTrigger value="file">파일</TabsTrigger>
          <TabsTrigger value="reference">레퍼런스</TabsTrigger>
          <TabsTrigger value="link">링크</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            노트를 추가하세요
          </CardContent>
        </Card>
      ) : tab === 'all' ? (
        // Grouped view when showing all
        <div className="space-y-6">
          {(Object.keys(TYPE_CONFIG) as NoteType[]).map(type => {
            const items = grouped[type]
            if (items.length === 0) return null
            const config = TYPE_CONFIG[type]
            const Icon = config.icon
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{config.label}</span>
                  <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map(note => (
                    <NoteCard key={note.id} note={note} areas={areas} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Flat list for filtered view
        <div className="space-y-2">
          {notes.map(note => (
            <NoteCard key={note.id} note={note} areas={areas} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function NoteCard({ note, areas, onDelete }: {
  note: { id: string; title: string; type: NoteType; priority: number; area_id?: string; url?: string; created_at: string }
  areas: { id: string; title: string }[]
  onDelete: (id: string, title: string) => void
}) {
  const router = useRouter()
  const config = TYPE_CONFIG[note.type]
  const Icon = config.icon
  const area = areas.find(a => a.id === note.area_id)

  return (
    <Card
      className="group hover:border-primary/30 transition-colors cursor-pointer"
      onClick={() => router.push(`/notes/${note.id}`)}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-md flex items-center justify-center border', config.color)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge className={cn('text-[10px] px-1.5 py-0', PRIORITY_COLORS[note.priority])}>
                P{note.priority}
              </Badge>
              <span className="text-sm font-medium truncate">{note.title}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {area && (
                <span className="text-[10px] text-muted-foreground">{area.title}</span>
              )}
              {note.url && (
                <a
                  href={note.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary flex items-center gap-0.5 hover:underline"
                  onClick={e => e.stopPropagation()}
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[200px]">{note.url}</span>
                </a>
              )}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(note.id, note.title) }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
          >
            <Trash2 className="w-3.5 h-3.5 text-gatsaeng-red" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
