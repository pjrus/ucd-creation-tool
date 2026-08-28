import type { DiagramEdgeLayout, DiagramPoint } from '@/features/layout/types'
import type { Relationship } from '@/lib/ucd/types'

export type RelationshipMarkerIds = {
  dependency: string
  generalization: string
}

export type RelationshipEdgeProps = {
  relationship: Relationship
  layout: DiagramEdgeLayout
  markerIds: RelationshipMarkerIds
}

export function RelationshipEdge({
  relationship,
  layout,
  markerIds,
}: RelationshipEdgeProps) {
  if (layout.points.length < 2) return null

  const isDependency =
    relationship.type === 'include' || relationship.type === 'extend'
  const label = isDependency ? `«${relationship.type}»` : relationship.label
  const labelPosition = layout.labelPosition ?? midpointAlongPath(layout.points)
  const markerEnd =
    relationship.type === 'generalization'
      ? `url(#${markerIds.generalization})`
      : isDependency
        ? `url(#${markerIds.dependency})`
        : undefined

  return (
    <g
      data-relationship-id={relationship.id}
      data-relationship-type={relationship.type}
      aria-label={`${relationship.sourceName} ${relationship.type} ${relationship.targetName}`}
      role="group"
    >
      <path
        d={toPath(layout.points)}
        className="fill-none stroke-diagram-edge"
        strokeWidth={1.5}
        strokeDasharray={isDependency ? '6 5' : undefined}
        markerEnd={markerEnd}
      />
      {label ? (
        <g transform={`translate(${labelPosition.x} ${labelPosition.y})`}>
          <rect
            x={-(label.length * 3.7 + 6)}
            y={-10}
            width={label.length * 7.4 + 12}
            height={20}
            rx={3}
            className="fill-diagram-surface"
          />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-diagram-muted text-[11px] font-medium"
          >
            {label}
          </text>
        </g>
      ) : null}
    </g>
  )
}

function toPath(points: DiagramPoint[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}

function midpointAlongPath(points: DiagramPoint[]): DiagramPoint {
  const segments = points.slice(1).map((point, index) => {
    const start = points[index]
    return {
      start,
      end: point,
      length: Math.hypot(point.x - start.x, point.y - start.y),
    }
  })
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0)
  const halfway = totalLength / 2
  let travelled = 0

  for (const segment of segments) {
    if (travelled + segment.length >= halfway) {
      const progress =
        segment.length === 0 ? 0 : (halfway - travelled) / segment.length
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * progress,
        y: segment.start.y + (segment.end.y - segment.start.y) * progress,
      }
    }
    travelled += segment.length
  }

  return points[0] ?? { x: 0, y: 0 }
}
