'use client'

import { useEffect } from 'react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[RootError]', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-black text-white">
      <h2 className="text-lg font-bold text-red-500">Application Error</h2>
      <p className="text-xs text-red-400 bg-red-950/30 p-4 rounded-lg max-w-2xl overflow-auto">
        {error.message}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded bg-white text-black text-sm font-semibold"
      >
        다시 시도
      </button>
    </div>
  )
}
