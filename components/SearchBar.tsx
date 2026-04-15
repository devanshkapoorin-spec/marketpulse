'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

const POPULAR = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX']

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/stock/${query.trim().toUpperCase()}`)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value.toUpperCase())}
          placeholder="Search any stock ticker — AAPL, TSLA, NVDA..."
          className="w-full bg-bg-secondary border border-border text-text-primary placeholder-text-muted
                     rounded-xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:border-accent-blue
                     transition-colors"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-accent-blue text-bg-primary
                     font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
        >
          Analyse
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {POPULAR.map(t => (
          <button
            key={t}
            onClick={() => router.push(`/stock/${t}`)}
            className="bg-bg-secondary border border-border text-text-secondary hover:text-accent-blue
                       hover:border-accent-blue text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  )
}
