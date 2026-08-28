import type { DiagramSystemLayout } from '@/features/layout/types'
import type { SystemBoundary as SystemBoundaryModel } from '@/lib/ucd/types'

export type SystemBoundaryProps = {
  system: SystemBoundaryModel
  layout: DiagramSystemLayout
}

export function SystemBoundary({ system, layout }: SystemBoundaryProps) {
  return (
    <g
      data-system-id={system.id}
      aria-label={`System boundary: ${system.name}`}
      role="group"
    >
      <rect
        x={layout.x}
        y={layout.y}
        width={layout.width}
        height={layout.height}
        rx={4}
        className="fill-diagram-system stroke-diagram-ink"
        strokeWidth={1.5}
      />
      <text
        x={layout.x + 16}
        y={layout.y + 23}
        className="fill-diagram-ink text-[13px] font-semibold"
      >
        {system.name}
      </text>
      <line
        x1={layout.x}
        x2={layout.x + layout.width}
        y1={layout.y + 34}
        y2={layout.y + 34}
        className="stroke-diagram-rule"
      />
    </g>
  )
}
