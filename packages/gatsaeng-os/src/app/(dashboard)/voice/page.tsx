'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, Loader2, Volume2, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

type Message = { role: 'user' | 'assistant'; content: string; audioUrl?: string }
type VoiceState = 'idle' | 'recording' | 'processing' | 'playing'

export default function VoicePage() {
  const [state, setState] = useState<VoiceState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const historyRef = useRef<Message[]>([])

  // Keep historyRef in sync
  const pushMessage = useCallback((msg: Message) => {
    setMessages(prev => {
      const next = [...prev, msg].slice(-20) // keep UI messages
      historyRef.current = next.slice(-10)   // keep 10 for API context
      return next
    })
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorderRef.current = recorder
      recorder.start()
      setState('recording')
    } catch {
      setError('마이크 접근 권한이 필요합니다.')
    }
  }, [])

  const stopAndSend = useCallback(async () => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state !== 'recording') return

    setState('processing')

    // Stop recording and collect blob
    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: 'audio/webm' }))
      }
      recorder.stop()
    })

    // Release mic
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null

    if (blob.size < 1000) {
      setState('idle')
      return // too short, ignore
    }

    try {
      // 1. Transcribe
      const form = new FormData()
      form.append('audio', blob, 'recording.webm')
      const sttRes = await fetch('/api/voice/transcribe', { method: 'POST', body: form })
      if (!sttRes.ok) throw new Error('STT 실패')
      const { text } = await sttRes.json()
      if (!text?.trim()) { setState('idle'); return }

      pushMessage({ role: 'user', content: text })

      // 2. Chat
      const chatRes = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyRef.current }),
      })
      if (!chatRes.ok) throw new Error('Chat 실패')
      const { reply } = await chatRes.json()

      pushMessage({ role: 'assistant', content: reply })

      // 3. TTS — fetch audio, store URL for user-gesture play (iOS safe)
      setState('playing')
      const ttsRes = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply }),
      })
      if (!ttsRes.ok) throw new Error('TTS 실패')

      const audioBlob = await ttsRes.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Store audioUrl on the last message so user can tap ▶ to play (iOS autoplay policy)
      setMessages(prev => {
        const next = [...prev]
        const last = next[next.length - 1]
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, audioUrl }
        return next
      })
      setState('idle')
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
      setState('idle')
    }
  }, [pushMessage])

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center py-4 border-b border-border">
        <h1 className="text-lg font-bold">Eve Voice</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          버튼을 누르고 말하세요
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Eve에게 무엇이든 물어보세요
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-muted text-foreground rounded-br-md'
                  : 'bg-primary/10 text-foreground rounded-bl-md'
              )}
            >
              {msg.role === 'assistant' && (
                <span className="text-xs font-medium text-primary block mb-1">Eve</span>
              )}
              {msg.content}
              {msg.role === 'assistant' && msg.audioUrl && (
                <button
                  onClick={() => {
                    const audio = new Audio(msg.audioUrl!)
                    audio.onended = () => setState('idle')
                    setState('playing')
                    audio.play().catch(() => setState('idle'))
                  }}
                  className="mt-2 flex items-center gap-1 text-xs text-primary/70 hover:text-primary"
                >
                  <Play className="w-3 h-3" /> 재생
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 text-center text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Mic Button */}
      <div className="flex flex-col items-center gap-2 py-6 border-t border-border">
        <button
          onPointerDown={startRecording}
          onPointerUp={stopAndSend}
          onPointerLeave={() => {
            if (state === 'recording') stopAndSend()
          }}
          disabled={state === 'processing' || state === 'playing'}
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center transition-all select-none touch-none',
            state === 'idle' && 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
            state === 'recording' && 'bg-red-500 text-white animate-pulse scale-110',
            state === 'processing' && 'bg-muted text-muted-foreground cursor-wait',
            state === 'playing' && 'bg-green-500 text-white cursor-default'
          )}
        >
          {state === 'idle' && <Mic className="w-8 h-8" />}
          {state === 'recording' && <Mic className="w-8 h-8" />}
          {state === 'processing' && <Loader2 className="w-8 h-8 animate-spin" />}
          {state === 'playing' && <Volume2 className="w-8 h-8" />}
        </button>
        <span className="text-xs text-muted-foreground">
          {state === 'idle' && '꾹 눌러서 말하기'}
          {state === 'recording' && '듣고 있어요...'}
          {state === 'processing' && '처리 중...'}
          {state === 'playing' && 'Eve가 말하는 중...'}
        </span>
      </div>
    </div>
  )
}
