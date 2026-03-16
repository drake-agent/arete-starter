'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface InlineEditProps {
  value: string
  onSave: (newValue: string) => void
  className?: string
  inputClassName?: string
  placeholder?: string
}

export function InlineEdit({
  value,
  onSave,
  className,
  inputClassName,
  placeholder = '입력...',
}: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    }
    setEditing(false)
  }

  const handleCancel = () => {
    setEditValue(value)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') handleCancel()
        }}
        className={cn(
          'bg-transparent border-b border-primary/50 outline-none px-0 py-0.5',
          inputClassName
        )}
        placeholder={placeholder}
      />
    )
  }

  return (
    <span
      className={cn('cursor-pointer hover:text-primary/80 transition-colors', className)}
      onDoubleClick={() => {
        setEditValue(value)
        setEditing(true)
      }}
      title="더블클릭하여 편집"
    >
      {value}
    </span>
  )
}
