import { CircleCheck, CircleDashed, CircleX, FileCode2 } from 'lucide-react'

import { cn } from '@/lib/utils'

export type EditorToolbarProps = {
  title: string
  status: 'checking' | 'error' | 'layout' | 'ready'
  stats?: { actors: number; useCases: number; relationships: number }
  diagramId?: string
}

export function EditorToolbar({
  title,
  status,
  stats,
  diagramId,
}: EditorToolbarProps) {
  const statusContent = {
    checking: { label: 'Checking source', icon: CircleDashed },
    error: { label: 'Preview paused', icon: CircleX },
    layout: { label: 'Arranging diagram', icon: CircleDashed },
    ready: { label: 'Preview current', icon: CircleCheck },
  }[status]
  const StatusIcon = statusContent.icon

  return (
    <div className="flex min-h-13 flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background px-4 py-2 sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <FileCode2
          className="size-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {diagramId
              ? `Local diagram · ${diagramId}`
              : 'Unsaved local diagram'}
          </p>
        </div>
      </div>
      {stats ? (
        <p className="ml-auto hidden text-xs text-muted-foreground lg:block">
          {stats.actors} actors · {stats.useCases} use cases ·{' '}
          {stats.relationships} relationships
        </p>
      ) : null}
      <div
        className={cn(
          'ml-auto flex items-center gap-1.5 text-xs font-medium lg:ml-0',
          status === 'error' && 'text-destructive',
          status === 'ready' && 'text-emerald-700 dark:text-emerald-400',
          (status === 'checking' || status === 'layout') &&
            'text-muted-foreground',
        )}
      >
        <StatusIcon className="size-3.5" aria-hidden="true" />
        <span>{statusContent.label}</span>
      </div>
    </div>
  )
}
