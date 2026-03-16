'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import {
  StickyNote,
  CheckSquare,
  Target,
  FolderKanban,
  BookMarked,
  LayoutDashboard,
  Layers,
  RotateCcw,
  CalendarDays,
  Timer,
  BookOpen,
} from 'lucide-react'
import { useNotes } from '@/hooks/useNotes'
import { useTasks } from '@/hooks/useProjects'
import { useGoals } from '@/hooks/useGoals'
import { useProjects } from '@/hooks/useProjects'
import { useBooks } from '@/hooks/useBooks'

const PAGES = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/areas', label: '영역', icon: Layers },
  { href: '/goals', label: '목표', icon: Target },
  { href: '/projects', label: '프로젝트', icon: FolderKanban },
  { href: '/tasks', label: '할일', icon: CheckSquare },
  { href: '/routines', label: '루틴', icon: RotateCcw },
  { href: '/notes', label: '노트', icon: StickyNote },
  { href: '/books', label: '독서', icon: BookMarked },
  { href: '/calendar', label: '캘린더', icon: CalendarDays },
  { href: '/focus', label: '포커스', icon: Timer },
  { href: '/review', label: '계획 & 회고', icon: BookOpen },
]

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Data queries - only fetch when dialog is open
  const { data: notes = [] } = useNotes()
  const { data: tasks = [] } = useTasks()
  const { data: goals = [] } = useGoals()
  const { data: projects = [] } = useProjects()
  const { data: books = [] } = useBooks()

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="검색"
      description="페이지, 노트, 할일, 목표를 검색하세요"
      showCloseButton={false}
    >
      <CommandInput placeholder="검색..." />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다</CommandEmpty>

        <CommandGroup heading="페이지">
          {PAGES.map(page => {
            const Icon = page.icon
            return (
              <CommandItem
                key={page.href}
                value={`page-${page.label}`}
                onSelect={() => handleSelect(page.href)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {page.label}
              </CommandItem>
            )
          })}
        </CommandGroup>

        {notes.length > 0 && (
          <CommandGroup heading="노트">
            {notes.map(note => (
              <CommandItem
                key={note.id}
                value={`note-${note.title}`}
                onSelect={() => handleSelect(`/notes/${note.id}`)}
              >
                <StickyNote className="w-4 h-4 mr-2" />
                {note.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {tasks.length > 0 && (
          <CommandGroup heading="할일">
            {tasks.map(task => (
              <CommandItem
                key={task.id}
                value={`task-${task.title}`}
                onSelect={() => handleSelect(`/tasks/${task.id}`)}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                {task.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {goals.length > 0 && (
          <CommandGroup heading="목표">
            {goals.map(goal => (
              <CommandItem
                key={goal.id}
                value={`goal-${goal.title}`}
                onSelect={() => handleSelect(`/goals/${goal.id}`)}
              >
                <Target className="w-4 h-4 mr-2" />
                {goal.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {projects.length > 0 && (
          <CommandGroup heading="프로젝트">
            {projects.map(project => (
              <CommandItem
                key={project.id}
                value={`project-${project.title}`}
                onSelect={() => handleSelect(`/projects/${project.id}`)}
              >
                <FolderKanban className="w-4 h-4 mr-2" />
                {project.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {books.length > 0 && (
          <CommandGroup heading="독서">
            {books.map(book => (
              <CommandItem
                key={book.id}
                value={`book-${book.title} ${book.author}`}
                onSelect={() => handleSelect(`/books/${book.id}`)}
              >
                <BookMarked className="w-4 h-4 mr-2" />
                {book.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
