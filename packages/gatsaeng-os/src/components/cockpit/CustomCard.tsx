'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check } from 'lucide-react'
import type { CockpitCard } from '@/stores/cockpitStore'
import { useCockpitStore } from '@/stores/cockpitStore'

export function CustomCard({ card }: { card: CockpitCard }) {
  const updateCard = useCockpitStore(s => s.updateCard)
  const [editing, setEditing] = useState(!card.content)
  const [localContent, setLocalContent] = useState(card.content || '')
  const textRef = useRef<HTMLTextAreaElement>(null)

  // Sync local state if card content changes externally
  useEffect(() => {
    if (!editing) setLocalContent(card.content || '')
  }, [card.content, editing])

  useEffect(() => {
    if (editing && textRef.current) {
      textRef.current.focus()
    }
  }, [editing])

  const handleSave = () => {
    // Persist to store only on save (not every keystroke)
    if (localContent !== (card.content || '')) {
      updateCard(card.id, { content: localContent })
    }
    setEditing(false)
  }

  return (
    <div className="p-3 h-full flex flex-col relative group/custom">
      {/* Edit toggle */}
      <button
        aria-label={editing ? '저장' : '편집'}
        onClick={() => editing ? handleSave() : setEditing(true)}
        className="absolute top-2 right-2 p-1 rounded hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover/custom:opacity-100 z-10"
      >
        {editing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
      </button>

      {editing ? (
        <textarea
          ref={textRef}
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleSave}
          className="w-full flex-1 resize-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none leading-relaxed"
          placeholder="카드 내용을 입력하세요..."
        />
      ) : (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setEditing(true)}
          className="text-xs text-foreground whitespace-pre-wrap leading-relaxed cursor-text flex-1"
          onClick={() => setEditing(true)}
        >
          {card.content || '내용을 입력하려면 클릭하세요'}
        </div>
      )}
    </div>
  )
}
