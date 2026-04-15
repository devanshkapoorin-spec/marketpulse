import Link from 'next/link'
import SearchBar from '@/components/SearchBar'

const POPULAR = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL']

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl font-black text-accent-blue/10 mb-2 select-none">404</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Ticker not found</h1>
      <p className="text-text-secondary text-sm mb-10 max-w-sm">
        That symbol doesn&apos;t exist or may be delisted. Try searching for a different ticker below.
      </p>

      <div className="w-full max-w-xl mb-8">
        <SearchBar />
      </div>

      <div className="mt-4">
        <p className="text-xs text-text-muted mb-3">Or jump straight to a popular stock</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {POPULAR.map(t => (
            <Link key={t} href={`/stock/${t}`}
              className="bg-bg-secondary border border-border text-text-secondary hover:text-accent-blue
                         hover:border-accent-blue text-sm px-3 py-1.5 rounded-lg transition-colors">
              {t}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
