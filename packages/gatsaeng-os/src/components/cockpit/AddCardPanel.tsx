'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, X, ArrowLeft, Sparkles, Send, Loader2 } from 'lucide-react'
import { useCockpitStore } from '@/stores/cockpitStore'
import { getAvailableCards, getCardDef, type CockpitCardType } from './cardRegistry'
import { resolveCardColor } from './cardColors'

const AVAILABLE_CARDS = getAvailableCards()

interface CardSpec {
  name: string
  emoji: string
  color: string
  description: string
  defaultContent?: string
  cardType?: string
}

interface ChatMessage {
  id: number
  role: 'user' | 'eve'
  text: string
  cardSpec?: CardSpec
  cardType?: string
}

function isValidCardType(type: string): boolean {
  return getCardDef(type) !== undefined
}

type PanelView = 'list' | 'chat'

export function AddCardPanel() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<PanelView>('list')
  const addCard = useCockpitStore(s => s.addCard)
  const msgIdRef = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (view === 'chat' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [view])

  const handleClose = useCallback(() => {
    abortRef.current?.abort()
    setOpen(false)
    setView('list')
    setMessages([])
    setInput('')
    setLoading(false)
  }, [])

  // Escape key to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, handleClose])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { id: ++msgIdRef.current, role: 'user', text }])
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/cockpit/card-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: controller.signal,
      })

      const data = await res.json()

      if (data.cardType && isValidCardType(data.cardType)) {
        setMessages(prev => [
          ...prev,
          { id: ++msgIdRef.current, role: 'eve', text: data.message, cardType: data.cardType },
        ])
      } else if (data.cardSpec) {
        setMessages(prev => [
          ...prev,
          { id: ++msgIdRef.current, role: 'eve', text: data.message, cardSpec: data.cardSpec },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          { id: ++msgIdRef.current, role: 'eve', text: data.message || data.raw || '다시 한번 설명해주세요!' },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { id: ++msgIdRef.current, role: 'eve', text: 'Eve 연결에 실패했어요. 잠시 후 다시 시도해주세요.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFromSpec = (spec: CardSpec) => {
    const type = spec.cardType && isValidCardType(spec.cardType) ? spec.cardType : 'custom'
    const color = resolveCardColor(spec.color)
    addCard(type as CockpitCardType, {
      title: spec.name,
      content: spec.defaultContent || '',
      meta: {
        emoji: spec.emoji,
        label: spec.name.toUpperCase(),
        ...color,
      },
    })
    handleClose()
  }

  const handleCreateFromType = (cardType: string) => {
    if (isValidCardType(cardType)) {
      addCard(cardType as CockpitCardType)
    }
    handleClose()
  }

  // Filter out 'custom' from preset list
  const presetCards = AVAILABLE_CARDS.filter(c => c.type !== 'custom')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        카드 추가
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleClose}>
          <div role="dialog" aria-modal="true" aria-label="카드 추가" className="bg-card rounded-sm border border-border shadow-none w-full max-w-md mx-4 mb-4 sm:mb-0 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                {view === 'chat' && (
                  <button onClick={() => { setView('list'); setMessages([]) }} className="p-0.5 hover:bg-muted rounded">
                    <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                <h3 className="font-semibold text-sm">
                  {view === 'list' ? '카드 추가' : '✨ Eve에게 카드 요청'}
                </h3>
              </div>
              <button onClick={handleClose}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {view === 'list' ? (
              <div className="p-4 max-h-96 overflow-y-auto">
                {/* Eve chat card builder */}
                <button
                  onClick={() => setView('chat')}
                  className="w-full text-left px-3 py-3 rounded-sm border border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-colors mb-3 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-primary">신규 카드 만들기</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Eve에게 원하는 카드를 설명하세요</div>
                  </div>
                </button>

                {/* Preset cards grid */}
                <div className="grid grid-cols-2 gap-2">
                  {presetCards.map((card) => (
                    <button
                      key={card.type}
                      onClick={() => {
                        addCard(card.type as CockpitCardType)
                        handleClose()
                      }}
                      className="text-left px-3 py-3 rounded-sm border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <div className="text-sm font-medium">{card.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{card.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat view */
              <div className="flex flex-col flex-1 min-h-0" style={{ minHeight: '400px' }}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {/* Welcome */}
                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-3xl mb-3">🍎</div>
                      <p className="text-sm text-muted-foreground">
                        어떤 카드를 만들까요?
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {['날씨 위젯', '뉴스 피드', '메모장', '할일 목록'].map((hint) => (
                          <button
                            key={hint}
                            onClick={() => { setInput(hint + ' 만들어줘'); inputRef.current?.focus() }}
                            className="px-3 py-1.5 text-xs rounded-full border border-border hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {hint}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div key={msg.id}>
                      {msg.role === 'user' ? (
                        <div className="flex justify-end">
                          <div className="bg-primary text-primary-foreground px-3 py-2 rounded-sm rounded-br-md text-sm max-w-[80%]">
                            {msg.text}
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs">🍎</span>
                          </div>
                          <div className="space-y-2 max-w-[85%]">
                            <div className="bg-muted/50 px-3 py-2 rounded-sm rounded-bl-md text-sm">
                              {msg.text}
                            </div>

                            {/* Existing card type → direct add button */}
                            {msg.cardType && (
                              <button
                                onClick={() => handleCreateFromType(msg.cardType!)}
                                className="w-full py-2 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                              >
                                이 카드 추가하기
                              </button>
                            )}

                            {/* Custom card spec → preview + create button */}
                            {msg.cardSpec && (
                              <div className="space-y-2">
                                <CardPreview spec={msg.cardSpec} />
                                <button
                                  onClick={() => handleCreateFromSpec(msg.cardSpec!)}
                                  className="w-full py-2 rounded-sm bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                  이 카드 추가하기
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                        <span className="text-xs">🍎</span>
                      </div>
                      <div className="bg-muted/50 px-3 py-2 rounded-sm rounded-bl-md">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border px-4 py-3 shrink-0">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
                      placeholder="예: 날씨 위젯 만들어줘"
                      className="flex-1 px-3 py-2 rounded-sm border border-border bg-background text-sm outline-none focus:border-primary transition-colors"
                      disabled={loading}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || loading}
                      className="p-2 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Card Preview Component ───

function CardPreview({ spec }: { spec: CardSpec }) {
  const color = resolveCardColor(spec.color)
  return (
    <div className={`rounded-sm border border-border border-l-2 ${color.borderColor} ${color.bgTint} overflow-hidden`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <span className="text-sm">{spec.emoji}</span>
        <span className={`font-mono text-[10px] font-semibold tracking-wider ${color.accentColor}`}>
          {spec.name.toUpperCase()}
        </span>
      </div>
      <div className="px-3 py-2">
        <p className="text-xs text-muted-foreground">{spec.description}</p>
      </div>
    </div>
  )
}
