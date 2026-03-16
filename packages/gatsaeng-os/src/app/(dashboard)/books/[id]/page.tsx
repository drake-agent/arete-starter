'use client'

import { use, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Trash2, Star } from 'lucide-react'
import { useBook, useUpdateBook, useDeleteBook } from '@/hooks/useBooks'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { PinButton } from '@/components/shared/PinButton'
import { cn } from '@/lib/utils'
import type { BookStatus } from '@/types'

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: '읽는 중',
  completed: '완독',
  want_to_read: '읽고 싶은',
  dropped: '중단',
}

const STATUS_COLORS: Record<BookStatus, string> = {
  reading: 'border-gatsaeng-teal/30 text-gatsaeng-teal',
  completed: 'border-primary/30 text-primary',
  want_to_read: 'border-gatsaeng-amber/30 text-gatsaeng-amber',
  dropped: 'border-muted-foreground/30 text-muted-foreground',
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: book, isLoading } = useBook(id)
  const updateBook = useUpdateBook()
  const deleteBook = useDeleteBook()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')

  const handleTitleSave = useCallback(() => {
    if (!book || !titleValue.trim()) return
    if (titleValue !== book.title) {
      updateBook.mutate({ id, title: titleValue })
    }
    setEditingTitle(false)
  }, [id, book, titleValue, updateBook])

  const handleContentSave = useCallback((markdown: string) => {
    updateBook.mutate({ id, content: markdown })
  }, [id, updateBook])

  const handleDelete = () => {
    if (!confirm('이 책을 삭제하시겠습니까?')) return
    deleteBook.mutate(id, {
      onSuccess: () => router.push('/books'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">책을 찾을 수 없습니다</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/books')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 돌아가기
        </Button>
      </div>
    )
  }

  const progress = book.total_pages && book.current_page
    ? Math.round((book.current_page / book.total_pages) * 100)
    : null

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.push('/books')}>
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
                setTitleValue(book.title)
                setEditingTitle(true)
              }}
              title="더블클릭하여 편집"
            >
              {book.title}
            </h1>
          )}
          <p className="text-sm text-muted-foreground">{book.author}</p>
        </div>
        <PinButton type="book" id={id} title={book.title} size={20} />
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-muted-foreground hover:text-gatsaeng-red">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Properties */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">상태</label>
              <Select
                value={book.status}
                onValueChange={(v) => updateBook.mutate({ id, status: v as BookStatus })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">평점</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => updateBook.mutate({ id, rating: n })}
                    className="transition-colors"
                  >
                    <Star
                      className={cn(
                        'w-5 h-5',
                        n <= (book.rating ?? 0)
                          ? 'text-gatsaeng-amber fill-gatsaeng-amber'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">현재 페이지</label>
              <Input
                type="number"
                value={book.current_page ?? ''}
                onChange={(e) => updateBook.mutate({ id, current_page: Number(e.target.value) || 0 })}
                className="h-8 text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">총 페이지</label>
              <Input
                type="number"
                value={book.total_pages ?? ''}
                onChange={(e) => updateBook.mutate({ id, total_pages: Number(e.target.value) || 0 })}
                className="h-8 text-sm"
                placeholder="0"
              />
            </div>
          </div>

          {/* Progress bar */}
          {progress !== null && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>진행률</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gatsaeng-teal rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor */}
      <Card>
        <CardContent className="p-0">
          <TiptapEditor
            content={book._content ?? ''}
            onSave={handleContentSave}
            placeholder="독서 노트를 작성하세요..."
          />
        </CardContent>
      </Card>
    </div>
  )
}
