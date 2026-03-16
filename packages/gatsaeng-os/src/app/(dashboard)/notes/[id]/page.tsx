'use client'

import { use, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { PinButton } from '@/components/shared/PinButton'
import type { NoteType, NotePriority } from '@/types'

const TYPE_LABELS: Record<NoteType, string> = {
  note: '노트',
  file: '파일',
  reference: '레퍼런스',
  link: '링크',
}

const PRIORITY_COLORS: Record<NotePriority, string> = {
  1: 'border-gatsaeng-red/30 text-gatsaeng-red',
  2: 'border-gatsaeng-amber/30 text-gatsaeng-amber',
  3: 'border-gatsaeng-teal/30 text-gatsaeng-teal',
}

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: note, isLoading } = useNote(id)
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')

  const handleTitleSave = useCallback(() => {
    if (!note || !titleValue.trim()) return
    if (titleValue !== note.title) {
      updateNote.mutate({ id, title: titleValue })
    }
    setEditingTitle(false)
  }, [id, note, titleValue, updateNote])

  const handleContentSave = useCallback((markdown: string) => {
    updateNote.mutate({ id, content: markdown })
  }, [id, updateNote])

  const handleDelete = () => {
    if (!confirm('이 노트를 삭제하시겠습니까?')) return
    deleteNote.mutate(id, {
      onSuccess: () => router.push('/notes'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">노트를 찾을 수 없습니다</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/notes')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/notes')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') setEditingTitle(false)
              }}
              autoFocus
              className="text-2xl font-bold h-auto py-1"
            />
          ) : (
            <h1
              className="text-2xl font-bold text-foreground cursor-pointer hover:text-primary/80 transition-colors truncate"
              onDoubleClick={() => {
                setTitleValue(note.title)
                setEditingTitle(true)
              }}
              title="더블클릭하여 편집"
            >
              {note.title}
            </h1>
          )}
        </div>
        <PinButton type="note" id={id} title={note.title} size={20} />
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-gatsaeng-red">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Badge variant="outline">{TYPE_LABELS[note.type] ?? note.type}</Badge>
        <Badge variant="outline" className={PRIORITY_COLORS[note.priority]}>
          P{note.priority}
        </Badge>
        {note.url && (
          <a
            href={note.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline truncate max-w-xs"
          >
            {note.url}
          </a>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {note.created_at?.slice(0, 10)}
        </span>
      </div>

      {/* Editor */}
      <Card>
        <CardContent className="p-0">
          <TiptapEditor
            content={note._content ?? ''}
            onSave={handleContentSave}
            placeholder="노트 내용을 입력하세요..."
          />
        </CardContent>
      </Card>
    </div>
  )
}
