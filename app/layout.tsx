import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MarketPulse — Real-Time Stock Intelligence',
  description: 'AI-powered stock analysis with technical indicators, sentiment scoring, and portfolio optimization.',
  openGraph: {
    title: 'MarketPulse',
    description: 'Real-time stock intelligence powered by AI',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bg-primary text-text-primary min-h-screen`}>
        <nav className="border-b border-border bg-bg-primary/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent-blue flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-bg-primary fill-current">
                  <path d="M3 17l4-8 4 4 4-6 4 10H3z" />
                </svg>
              </div>
              <span className="font-bold text-text-primary tracking-tight">MarketPulse</span>
            </a>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="hidden sm:block">Free · No API key · Powered by Yahoo Finance</span>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="border-t border-border mt-16 py-8 text-center text-xs text-text-muted">
          <p>MarketPulse · Built with Next.js, Yahoo Finance & Recharts</p>
          <p className="mt-1">For educational purposes only. Not financial advice.</p>
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
