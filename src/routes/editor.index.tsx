import { createFileRoute } from '@tanstack/react-router'
import { SquarePen } from 'lucide-react'

import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/editor/')({ component: NewEditorPage })

function NewEditorPage() {
  return (
    <PagePlaceholder
      icon={SquarePen}
      title="New use case diagram"
      description="The live source editor and SVG preview will be assembled here after the standalone parser and renderer are ready."
    />
  )
}
