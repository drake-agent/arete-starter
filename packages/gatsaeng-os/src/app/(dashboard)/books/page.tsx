'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBooks, useCreateBook, useUpdateBook, useDeleteBook } from '@/hooks/useBooks'
import { useGoals } from '@/hooks/useGoals'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Plus, Star, Trash2, Minus } from 'lucide-react'
import type { Book, BookStatus } from '@/types'

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: '읽는 중',
  want_to_read: '읽고 싶은',
  completed: '완료',
  dropped: '중단',
}

const STATUS_COLORS: Record<BookStatus, string> = {
  reading: 'border-gatsaeng-teal text-gatsaeng-teal',
  want_to_read: 'border-primary text-primary',
  completed: 'border-gatsaeng-amber text-gatsaeng-amber',
  dropped: 'border-muted-foreground text-muted-foreground',
}

export default function BooksPage() {
  const router = useRouter()
  const { data: books, isLoading } = useBooks()
  const { data: goals } = useGoals()
  const createBook = useCreateBook()
  const updateBook = useUpdateBook()
  const deleteBook = useDeleteBook()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<string>('all')

  const filtered = (books ?? []).filter(b => tab === 'all' || b.status === tab)
  const counts = {
    all: (books ?? []).length,
    reading: (books ?? []).filter(b => b.status === 'reading').length,
    want_to_read: (books ?? []).filter(b => b.status === 'want_to_read').length,
    completed: (books ?? []).filter(b => b.status === 'completed').length,
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    await createBook.mutateAsync({
      title: form.get('title') as string,
      author: form.get('author') as string,
      total_pages: Number(form.get('total_pages')) || undefined,
      goal_id: (form.get('goal_id') as string) || undefined,
      status: 'want_to_read',
    })
    setOpen(false)
  }

  const handleStatusChange = (book: Book, status: BookStatus) => {
    const updates: Partial<Book> & { id: string } = { id: book.id, status }
    if (status === 'reading' && !book.started_at) {
      updates.started_at = new Date().toISOString()
    }
    if (status === 'completed') {
      updates.finished_at = new Date().toISOString()
      if (book.total_pages) updates.current_page = book.total_pages
    }
    updateBook.mutate(updates)
  }

  const handlePageUpdate = (book: Book, delta: number) => {
    const newPage = Math.max(0, Math.min(book.total_pages ?? 9999, (book.current_page ?? 0) + delta))
    updateBook.mutate({ id: book.id, current_page: newPage })
  }

  const handleRating = (book: Book, rating: number) => {
    updateBook.mutate({ id: book.id, rating })
  }

  const handleDelete = (id: string) => {
    if (!confirm('이 책을 삭제하시겠습니까?')) return
    deleteBook.mutate(id)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">독서</h1>
          <p className="text-sm text-muted-foreground mt-1">읽고 있는 책과 독서 기록</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gatsaeng-amber hover:bg-gatsaeng-amber/80 text-black">
              <Plus className="w-4 h-4 mr-2" /> 책 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>책 추가</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>제목</Label>
                <Input name="title" required placeholder="책 제목" />
              </div>
              <div>
                <Label>저자</Label>
                <Input name="author" required placeholder="저자 이름" />
              </div>
              <div>
                <Label>전체 페이지</Label>
                <Input name="total_pages" type="number" placeholder="300" />
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
                추가
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">전체 ({counts.all})</TabsTrigger>
          <TabsTrigger value="reading">읽는 중 ({counts.reading})</TabsTrigger>
          <TabsTrigger value="want_to_read">읽고 싶은 ({counts.want_to_read})</TabsTrigger>
          <TabsTrigger value="completed">완료 ({counts.completed})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card rounded-lg animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {tab === 'all' ? '아직 등록된 책이 없습니다' : `${STATUS_LABELS[tab as BookStatus]} 책이 없습니다`}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(book => {
            const progress = book.total_pages
              ? Math.min(100, Math.round(((book.current_page ?? 0) / book.total_pages) * 100))
              : null
            return (
              <Card
                key={book.id}
                className="hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => router.push(`/books/${book.id}`)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-14 rounded bg-card border border-border flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground truncate">{book.title}</h3>
                        <Badge variant="outline" className={STATUS_COLORS[book.status]}>
                          {STATUS_LABELS[book.status]}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{book.author}</div>

                      {/* Progress bar for reading books */}
                      {book.status === 'reading' && book.total_pages && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gatsaeng-teal rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground min-w-[60px] text-right">
                            {book.current_page ?? 0}/{book.total_pages}p
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); handlePageUpdate(book, -10) }}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); handlePageUpdate(book, 10) }}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Rating for completed books */}
                      {book.status === 'completed' && (
                        <div className="flex items-center gap-1 mb-2" onClick={e => e.stopPropagation()}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <button
                              key={s}
                              onClick={() => handleRating(book, s)}
                              className="p-0"
                            >
                              <Star
                                className={`w-4 h-4 ${s <= (book.rating ?? 0)
                                  ? 'fill-gatsaeng-amber text-gatsaeng-amber'
                                  : 'text-muted-foreground'}`}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <Select
                        value={book.status}
                        onValueChange={(v) => handleStatusChange(book, v as BookStatus)}
                      >
                        <SelectTrigger className="h-7 text-xs w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="want_to_read">읽고 싶은</SelectItem>
                          <SelectItem value="reading">읽는 중</SelectItem>
                          <SelectItem value="completed">완료</SelectItem>
                          <SelectItem value="dropped">중단</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-gatsaeng-red"
                        onClick={() => handleDelete(book.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
