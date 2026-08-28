import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react'

import { cn } from '@/lib/utils'

export type EditorIssue = {
  id: string
  severity: 'error' | 'warning'
  message: string
  line?: number
  hint?: string
}

export type EditorStatusPanelProps = {
  issues: EditorIssue[]
  summary: string
}

export function EditorStatusPanel({ issues, summary }: EditorStatusPanelProps) {
  const hasErrors = issues.some((issue) => issue.severity === 'error')
  const hasWarnings = issues.some((issue) => issue.severity === 'warning')
  const SummaryIcon = hasErrors
    ? AlertCircle
    : hasWarnings
      ? TriangleAlert
      : CheckCircle2

  return (
    <aside
      className="border-t bg-background"
      aria-label="Diagram status"
      aria-live="polite"
    >
      <div className="flex h-10 items-center gap-2 border-b px-4">
        <SummaryIcon
          className={cn(
            'size-4',
            hasErrors
              ? 'text-destructive'
              : hasWarnings
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400',
          )}
          aria-hidden="true"
        />
        <p className="text-xs font-medium">{summary}</p>
      </div>
      <div className="h-24 overflow-y-auto px-4 py-2">
        {issues.length === 0 ? (
          <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <p>
              Source is valid. The preview updates automatically as you type.
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {issues.map((issue) => (
              <li
                key={issue.id}
                className="flex items-start gap-2 text-xs leading-5"
              >
                <span
                  className={cn(
                    'mt-1.5 size-1.5 shrink-0 rounded-full',
                    issue.severity === 'error'
                      ? 'bg-destructive'
                      : 'bg-amber-500',
                  )}
                  aria-hidden="true"
                />
                <p>
                  {issue.line ? (
                    <span className="mr-2 font-mono text-muted-foreground">
                      Line {issue.line}
                    </span>
                  ) : null}
                  <span>{issue.message}</span>
                  {issue.hint ? (
                    <span className="ml-1 text-muted-foreground">
                      {issue.hint}
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
