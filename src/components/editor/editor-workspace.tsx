import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Network } from 'lucide-react'

import { DiagramSvg } from '@/components/diagram/diagram-svg'
import type { DiagramLayout } from '@/features/layout/types'
import { productDiscoveryExample } from '@/lib/ucd/examples'
import { parseUCD } from '@/lib/ucd/parser'
import type { UCDDocument } from '@/lib/ucd/types'
import { validateUCD } from '@/lib/ucd/validator'

import { EditorStatusPanel } from './editor-status-panel'
import type { EditorIssue } from './editor-status-panel'
import { EditorToolbar } from './editor-toolbar'
import { ResizableSplit } from './resizable-split'
import { SourceEditor } from './source-editor'

type PreviewState = {
  document: UCDDocument
  layout: DiagramLayout
}

export type EditorWorkspaceProps = {
  diagramId?: string
  initialSource?: string
}

export function EditorWorkspace({
  diagramId,
  initialSource = productDiscoveryExample,
}: EditorWorkspaceProps) {
  const [source, setSource] = useState(initialSource)
  const deferredSource = useDeferredValue(source)
  const parsed = useMemo(() => parseUCD(deferredSource), [deferredSource])
  const validationIssues = useMemo(
    () => (parsed.document ? validateUCD(parsed.document) : []),
    [parsed.document],
  )
  const issues = useMemo(
    () => toEditorIssues(parsed.errors, validationIssues),
    [parsed.errors, validationIssues],
  )
  const hasSemanticErrors = validationIssues.some(
    (issue) => issue.severity === 'error',
  )
  const validDocument =
    parsed.document && !hasSemanticErrors ? parsed.document : undefined
  const [preview, setPreview] = useState<PreviewState>()
  const [layoutStatus, setLayoutStatus] = useState<
    'idle' | 'pending' | 'error'
  >('idle')

  useEffect(() => {
    if (!validDocument) return

    let isCurrent = true
    setLayoutStatus('pending')
    // ELK is loaded only when a valid document needs layout work.
    void import('@/features/layout/elk-layout-engine')
      .then(({ elkLayoutEngine }) => elkLayoutEngine.layout(validDocument))
      .then((layout) => {
        if (!isCurrent) return
        setPreview({ document: validDocument, layout })
        setLayoutStatus('idle')
      })
      .catch(() => {
        if (isCurrent) setLayoutStatus('error')
      })

    return () => {
      isCurrent = false
    }
  }, [validDocument])

  const isChecking = deferredSource !== source
  const displayIssues =
    layoutStatus === 'error'
      ? [
          ...issues,
          {
            id: 'layout-error',
            severity: 'error' as const,
            message: 'The layout engine could not arrange this diagram.',
            hint: 'Review the relationships, then make another source change to retry.',
          },
        ]
      : issues
  const hasErrors = displayIssues.some((issue) => issue.severity === 'error')
  const toolbarStatus = isChecking
    ? 'checking'
    : hasErrors
      ? 'error'
      : layoutStatus === 'pending'
        ? 'layout'
        : 'ready'
  const currentDocument = parsed.document
  const title =
    currentDocument?.title ?? preview?.document.title ?? 'Untitled diagram'
  const summary = createSummary(displayIssues, currentDocument, layoutStatus)

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col bg-muted/25 md:h-[calc(100dvh-3.5rem)] md:min-h-0">
      <EditorToolbar
        title={title}
        status={toolbarStatus}
        diagramId={diagramId}
        stats={
          currentDocument
            ? {
                actors: currentDocument.actors.length,
                useCases: currentDocument.useCases.length,
                relationships: currentDocument.relationships.length,
              }
            : undefined
        }
      />
      <ResizableSplit
        first={
          <div className="flex h-full min-h-80 flex-col bg-editor-surface">
            <PanelHeading
              label="Source"
              detail={`${source.split('\n').length} lines`}
            />
            <div className="min-h-0 flex-1">
              <SourceEditor value={source} onChange={setSource} />
            </div>
          </div>
        }
        second={
          <div className="flex h-full min-h-80 flex-col bg-diagram-surface">
            <PanelHeading
              label="Diagram"
              detail={
                hasErrors && preview ? 'Last valid preview' : 'Live preview'
              }
            />
            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-5 sm:p-8">
              {preview ? (
                <DiagramSvg
                  document={preview.document}
                  layout={preview.layout}
                  width={preview.layout.width}
                  height={preview.layout.height}
                  className="shrink-0"
                />
              ) : layoutStatus === 'pending' ? (
                <PreviewSkeleton />
              ) : (
                <EmptyPreview />
              )}
            </div>
          </div>
        }
        firstLabel="UCD source editor"
        secondLabel="Diagram preview"
      />
      <EditorStatusPanel issues={displayIssues} summary={summary} />
    </main>
  )
}

function PanelHeading({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-b px-4">
      <h2 className="text-xs font-semibold">{label}</h2>
      <p className="font-mono text-[10px] text-muted-foreground">{detail}</p>
    </div>
  )
}

function PreviewSkeleton() {
  return (
    <div className="w-full max-w-lg" aria-label="Arranging diagram">
      <div className="h-3 w-40 rounded-sm bg-muted" />
      <div className="mt-6 flex items-center gap-12">
        <div className="h-28 w-20 rounded-sm bg-muted" />
        <div className="h-44 flex-1 rounded-md border bg-muted/40 p-6">
          <div className="h-14 rounded-[50%] bg-muted" />
          <div className="mt-5 h-14 rounded-[50%] bg-muted" />
        </div>
      </div>
    </div>
  )
}

function EmptyPreview() {
  return (
    <div className="max-w-sm text-center">
      <Network
        className="mx-auto size-7 text-muted-foreground"
        aria-hidden="true"
      />
      <p className="mt-4 text-sm font-medium">Nothing to preview yet</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Add an actor and a use case, then connect them with an association.
      </p>
    </div>
  )
}

function toEditorIssues(
  parserErrors: ReturnType<typeof parseUCD>['errors'],
  validationIssues: ReturnType<typeof validateUCD>,
): EditorIssue[] {
  return [
    ...parserErrors.map((error, index) => ({
      id: `parser-${error.line}-${error.column}-${index}`,
      severity: 'error' as const,
      message: error.message,
      line: error.line,
      hint: error.hint,
    })),
    ...validationIssues.map((issue, index) => ({
      id: `validation-${issue.code}-${index}`,
      severity: issue.severity,
      message: issue.message,
      line: issue.source?.start.line,
    })),
  ]
}

function createSummary(
  issues: EditorIssue[],
  document: UCDDocument | undefined,
  layoutStatus: 'idle' | 'pending' | 'error',
): string {
  const errors = issues.filter((issue) => issue.severity === 'error').length
  const warnings = issues.length - errors
  if (layoutStatus === 'error')
    return 'The diagram could not be arranged. Check the source and try again.'
  if (errors > 0)
    return `${errors} ${errors === 1 ? 'error' : 'errors'} must be fixed.`
  if (warnings > 0)
    return `${warnings} ${warnings === 1 ? 'warning' : 'warnings'} found.`
  if (!document) return 'Start writing to create a diagram.'
  if (layoutStatus === 'pending')
    return 'Source is valid. Arranging the updated diagram.'
  return `Valid diagram with ${document.actors.length + document.useCases.length} elements.`
}
