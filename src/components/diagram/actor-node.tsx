import type { DiagramNodeLayout } from '@/features/layout/types'
import type { Actor } from '@/lib/ucd/types'

import { SvgTextLabel } from './svg-text-label'

export type ActorNodeProps = {
  actor: Actor
  layout: DiagramNodeLayout
}

export function ActorNode({ actor, layout }: ActorNodeProps) {
  const centreX = layout.x + layout.width / 2
  const figureTop = layout.y + 8
  const labelY = layout.y + layout.height - 20

  return (
    <g data-node-id={actor.id} aria-label={`Actor: ${actor.name}`} role="group">
      <circle
        cx={centreX}
        cy={figureTop + 12}
        r={10}
        className="fill-diagram-surface stroke-diagram-ink"
        strokeWidth={2}
      />
      <path
        d={[
          `M ${centreX} ${figureTop + 22}`,
          `L ${centreX} ${figureTop + 56}`,
          `M ${centreX - 20} ${figureTop + 36}`,
          `L ${centreX} ${figureTop + 31}`,
          `L ${centreX + 20} ${figureTop + 36}`,
          `M ${centreX} ${figureTop + 56}`,
          `L ${centreX - 18} ${figureTop + 78}`,
          `M ${centreX} ${figureTop + 56}`,
          `L ${centreX + 18} ${figureTop + 78}`,
        ].join(' ')}
        className="fill-none stroke-diagram-ink"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <SvgTextLabel
        label={actor.name}
        x={centreX}
        y={labelY}
        maxCharacters={Math.max(12, Math.floor(layout.width / 7))}
        className="fill-diagram-ink text-[13px] font-medium"
      />
    </g>
  )
}
