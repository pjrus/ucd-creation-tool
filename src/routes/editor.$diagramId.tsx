import { createFileRoute } from '@tanstack/react-router'
import { SquarePen } from 'lucide-react'

import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/editor/$diagramId')({
  component: SavedEditorPage,
})

function SavedEditorPage() {
  const { diagramId } = Route.useParams()

  return (
    <PagePlaceholder
      icon={SquarePen}
      title="Saved diagram"
      description={`Diagram ${diagramId} will load from local browser storage here.`}
    />
  )
}
