'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <h2 className="text-lg font-bold text-red-500">Dashboard Error</h2>
      <p className="text-xs text-red-400 bg-red-950/30 p-4 rounded-lg max-w-lg overflow-auto">
        {error.message}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm"
      >
        다시 시도
      </button>
    </div>
  )
}
