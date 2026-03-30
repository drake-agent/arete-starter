'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Pencil, Trash2, X } from 'lucide-react'
import { useCockpitStore } from '@/stores/cockpitStore'
import { cn } from '@/lib/utils'

const WORKSPACE_ICONS = ['🏕️', '🎯', '🌊', '📌', '🧠', '💡', '🚀', '🔬', '🎨', '📊', '🏠', '⚡']

export function WorkspaceManager() {
  const [open, setOpen] = useState(false)
  const workspaces = useCockpitStore(s => s.workspaces)
  const activeWorkspaceId = useCockpitStore(s => s.activeWorkspaceId)
  const updateWorkspace = useCockpitStore(s => s.updateWorkspace)
  const removeWorkspace = useCockpitStore(s => s.removeWorkspace)
  const setActiveWorkspace = useCockpitStore(s => s.setActiveWorkspace)

  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [pickingIconId, setPickingIconId] = useState<string | null>(null)

  const startEdit = (id: string, name: string) => {
    setEditId(id)
    setEditName(name)
  }

  const saveEdit = () => {
    if (editId && editName.trim()) {
      updateWorkspace(editId, { name: editName.trim() })
    }
    setEditId(null)
  }

  const handleDelete = (id: string) => {
    removeWorkspace(id)
    setDeleteConfirmId(null)
  }

  const handleCloseModal = useCallback(() => {
    setOpen(false)
    setDeleteConfirmId(null)
  }, [])

  // Escape key to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCloseModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, handleCloseModal])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        title="워크스페이스 관리"
      >
        <Settings className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}>
          <div role="dialog" aria-modal="true" aria-label="워크스페이스 관리" className="bg-card rounded-sm border border-border shadow-none w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-sm">워크스페이스 관리</h3>
              <button onClick={handleCloseModal}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {workspaces.map(ws => (
                <div key={ws.id}>
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-sm border transition-colors',
                      activeWorkspaceId === ws.id
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    {/* Icon picker — click-toggle (works on touch devices) */}
                    <div className="relative">
                      <button
                        onClick={() => setPickingIconId(pickingIconId === ws.id ? null : ws.id)}
                        className="text-lg"
                        aria-label="아이콘 변경"
                      >
                        {ws.icon}
                      </button>
                      {pickingIconId === ws.id && (
                        <div className="absolute bottom-full left-0 mb-1 grid grid-cols-6 gap-1 bg-popover border border-border rounded-sm p-2 shadow-none z-10 min-w-[180px]">
                          {WORKSPACE_ICONS.map(icon => (
                            <button
                              key={icon}
                              onClick={() => { updateWorkspace(ws.id, { icon }); setPickingIconId(null) }}
                              className="text-base hover:bg-muted rounded p-1 transition-colors"
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    {editId === ws.id ? (
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={e => e.key === 'Enter' && saveEdit()}
                        className="flex-1 bg-transparent border-b border-primary text-sm outline-none"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setActiveWorkspace(ws.id)
                          setOpen(false)
                        }}
                        className="flex-1 text-left text-sm truncate"
                      >
                        {ws.name}
                      </button>
                    )}

                    {/* Card count */}
                    {!ws.special && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">{ws.cards.length}장</span>
                    )}
                    {ws.special && (
                      <span className="text-[10px] text-muted-foreground">{ws.special}</span>
                    )}

                    {/* Actions */}
                    {!ws.special && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(ws.id, ws.name)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {workspaces.filter(w => !w.special).length > 1 && (
                          <button
                            onClick={() => setDeleteConfirmId(ws.id)}
                            className="p-1 rounded hover:bg-gatsaeng-red/10 text-muted-foreground hover:text-gatsaeng-red transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Inline delete confirmation */}
                  {deleteConfirmId === ws.id && (
                    <div className="flex items-center gap-2 px-3 py-2 mt-1 rounded-sm bg-gatsaeng-red/5 border border-gatsaeng-red/20 text-xs">
                      <span className="flex-1 text-muted-foreground">
                        &ldquo;{ws.name}&rdquo; 삭제?
                      </span>
                      <button
                        onClick={() => handleDelete(ws.id)}
                        className="px-2 py-0.5 rounded bg-gatsaeng-red text-white hover:bg-gatsaeng-red/90 transition-colors"
                      >
                        삭제
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-0.5 rounded text-muted-foreground hover:bg-muted"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
