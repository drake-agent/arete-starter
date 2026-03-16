'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import LinkExtension from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useEffect, useRef, useCallback } from 'react'
import { EditorToolbar } from './EditorToolbar'
import { markdownToHtml, htmlToMarkdown } from '@/lib/editor/markdown'

interface TiptapEditorProps {
  content: string // markdown string from vault
  onSave: (markdown: string) => void
  placeholder?: string
  autoSaveMs?: number // debounce ms, 0 = manual only
  className?: string
  readOnly?: boolean
}

export function TiptapEditor({
  content,
  onSave,
  placeholder = '내용을 입력하세요...',
  autoSaveMs = 3000,
  className,
  readOnly = false,
}: TiptapEditorProps) {
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedRef = useRef(content)
  const isInitialRef = useRef(true)

  const handleSave = useCallback(
    (html: string) => {
      const md = htmlToMarkdown(html)
      if (md !== lastSavedRef.current) {
        lastSavedRef.current = md
        onSave(md)
      }
    },
    [onSave]
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: markdownToHtml(content),
    editable: !readOnly,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (isInitialRef.current) {
        isInitialRef.current = false
        return
      }
      if (autoSaveMs > 0) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          handleSave(ed.getHTML())
        }, autoSaveMs)
      }
    },
    onBlur: ({ editor: ed }) => {
      // save immediately on blur
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
      handleSave(ed.getHTML())
    },
  })

  // Update content when prop changes externally
  useEffect(() => {
    if (editor && content !== lastSavedRef.current) {
      const html = markdownToHtml(content)
      const currentHtml = editor.getHTML()
      if (html !== currentHtml) {
        isInitialRef.current = true
        editor.commands.setContent(html)
        lastSavedRef.current = content
      }
    }
  }, [content, editor])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  return (
    <div className={className}>
      {!readOnly && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  )
}
