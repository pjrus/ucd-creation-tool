import { createFileRoute } from '@tanstack/react-router'

import { EditorWorkspace } from '@/components/editor/editor-workspace'

export const Route = createFileRoute('/editor/')({ component: NewEditorPage })

function NewEditorPage() {
  return <EditorWorkspace />
}
