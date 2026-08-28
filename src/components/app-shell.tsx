import { Link } from '@tanstack/react-router'
import { BookOpenText, Home, Settings2, SquarePen } from 'lucide-react'

import { cn } from '@/lib/utils'

const navigationItems = [
  { to: '/', label: 'Diagrams', icon: Home },
  { to: '/editor', label: 'Editor', icon: SquarePen },
  { to: '/examples', label: 'Examples', icon: BookOpenText },
  { to: '/settings', label: 'Settings', icon: Settings2 },
] as const

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-5 px-4 sm:px-6">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 rounded-md font-semibold tracking-[-0.02em] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            aria-label="UCD Studio home"
          >
            <LogoMark />
            <span>UCD Studio</span>
          </Link>
          <nav
            className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto"
            aria-label="Primary navigation"
          >
            {navigationItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === '/' }}
                className={cn(
                  'flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors',
                  'hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                )}
                activeProps={{ className: 'bg-muted text-foreground' }}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}

function LogoMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="size-7 text-primary"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="3.5"
        width="27"
        height="25"
        rx="4"
        stroke="currentColor"
      />
      <ellipse cx="16" cy="16" rx="8" ry="4.5" fill="currentColor" />
    </svg>
  )
}
