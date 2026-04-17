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

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div
      role="alert"
      className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-black text-white"
    >
      <h2 className="text-lg font-bold text-red-500">Application Error</h2>
      {isDev ? (
        <pre className="text-xs text-red-400 bg-red-950/30 p-4 rounded-sm max-w-2xl overflow-auto whitespace-pre-wrap">
          {error.message}
          {'\n\n'}
          {error.stack}
        </pre>
      ) : (
        <p className="text-sm text-red-300">
          문제가 발생했습니다.
          {error.digest && (
            <span className="block mt-2 text-xs text-red-500/60">
              Reference: {error.digest}
            </span>
          )}
        </p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 rounded bg-white text-black text-sm font-semibold"
      >
        다시 시도
      </button>
    </div>
  )
}
