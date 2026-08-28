import { createFileRoute } from '@tanstack/react-router'

import { EditorWorkspace } from '@/components/editor/editor-workspace'

export const Route = createFileRoute('/editor/$diagramId')({
  component: SavedEditorPage,
})

function SavedEditorPage() {
  const { diagramId } = Route.useParams()
  return <EditorWorkspace diagramId={diagramId} />
}
