import type { DiagramNodeLayout } from '@/features/layout/types'
import type { UseCase } from '@/lib/ucd/types'

import { SvgTextLabel } from './svg-text-label'

export type UseCaseNodeProps = {
  useCase: UseCase
  layout: DiagramNodeLayout
}

export function UseCaseNode({ useCase, layout }: UseCaseNodeProps) {
  const centreX = layout.x + layout.width / 2
  const centreY = layout.y + layout.height / 2

  return (
    <g
      data-node-id={useCase.id}
      aria-label={`Use case: ${useCase.name}`}
      role="group"
    >
      <ellipse
        cx={centreX}
        cy={centreY}
        rx={layout.width / 2}
        ry={layout.height / 2}
        className="fill-diagram-surface stroke-diagram-ink"
        strokeWidth={1.5}
      />
      <SvgTextLabel
        label={useCase.name}
        x={centreX}
        y={centreY}
        maxCharacters={Math.max(14, Math.floor((layout.width - 24) / 7))}
        className="fill-diagram-ink text-[13px] font-medium"
      />
    </g>
  )
}
