import { createFileRoute } from '@tanstack/react-router'
import { BookOpenText } from 'lucide-react'

import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/examples')({ component: ExamplesPage })

function ExamplesPage() {
  return (
    <PagePlaceholder
      icon={BookOpenText}
      title="Examples"
      description="Explore complete syntax examples for common systems and relationship types."
    />
  )
}
