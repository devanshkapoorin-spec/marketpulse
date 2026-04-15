'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl font-black text-accent-red/10 mb-2 select-none">!</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
      <p className="text-text-secondary text-sm mb-8 max-w-sm">
        An unexpected error occurred. This is usually a temporary issue with the data provider.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-accent-blue text-bg-primary font-semibold px-5 py-2 rounded-lg
                     hover:opacity-90 transition-opacity text-sm"
        >
          Try again
        </button>
        <Link href="/"
          className="bg-bg-secondary border border-border text-text-secondary hover:text-text-primary
                     font-medium px-5 py-2 rounded-lg transition-colors text-sm">
          Go home
        </Link>
      </div>
    </div>
  )
}
