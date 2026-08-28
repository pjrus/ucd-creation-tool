import { createFileRoute } from '@tanstack/react-router'
import { Settings2 } from 'lucide-react'

import { PagePlaceholder } from '@/components/page-placeholder'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

function SettingsPage() {
  return (
    <PagePlaceholder
      icon={Settings2}
      title="Settings"
      description="Choose appearance, editor behaviour, and local storage preferences."
    />
  )
}
