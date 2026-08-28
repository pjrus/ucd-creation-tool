import { useId, useMemo } from 'react'
import type { ComponentProps } from 'react'

import type { DiagramLayout } from '@/features/layout/types'
import type { UCDDocument } from '@/lib/ucd/types'
import { cn } from '@/lib/utils'

import { ActorNode } from './actor-node'
import { RelationshipEdge } from './relationship-edge'
import { SystemBoundary } from './system-boundary'
import { UseCaseNode } from './use-case-node'

export type DiagramSvgProps = Omit<ComponentProps<'svg'>, 'children'> & {
  document: UCDDocument
  layout: DiagramLayout
}

export function DiagramSvg({
  document,
  layout,
  className,
  ...props
}: DiagramSvgProps) {
  const accessibleId = useId().replaceAll(':', '')
  const markerIds = {
    dependency: `${accessibleId}-dependency-arrow`,
    generalization: `${accessibleId}-generalization-arrow`,
  }
  const actorsById = useMemo(
    () => new Map(document.actors.map((actor) => [actor.id, actor])),
    [document.actors],
  )
  const useCasesById = useMemo(
    () => new Map(document.useCases.map((useCase) => [useCase.id, useCase])),
    [document.useCases],
  )
  const systemsById = useMemo(
    () => new Map(document.systems.map((system) => [system.id, system])),
    [document.systems],
  )
  const relationshipsById = useMemo(
    () =>
      new Map(
        document.relationships.map((relationship) => [
          relationship.id,
          relationship,
        ]),
      ),
    [document.relationships],
  )

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-labelledby={`${accessibleId}-title ${accessibleId}-description`}
      className={cn(
        'block max-h-full max-w-full bg-diagram-surface',
        className,
      )}
      {...props}
    >
      <title id={`${accessibleId}-title`}>
        {document.title ?? 'UML use case diagram'}
      </title>
      <desc id={`${accessibleId}-description`}>
        {`${document.actors.length} actors, ${document.useCases.length} use cases, and ${document.relationships.length} relationships.`}
      </desc>
      <defs>
        <marker
          id={markerIds.dependency}
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M 1 1 L 9 5 L 1 9"
            className="fill-none stroke-diagram-edge"
          />
        </marker>
        <marker
          id={markerIds.generalization}
          markerWidth="12"
          markerHeight="12"
          refX="11"
          refY="6"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M 1 1 L 11 6 L 1 11 Z"
            className="fill-diagram-surface stroke-diagram-edge"
          />
        </marker>
      </defs>

      {document.title ? (
        <text
          x="24"
          y="30"
          className="fill-diagram-ink text-[15px] font-semibold"
        >
          {document.title}
        </text>
      ) : null}

      {layout.systems.map((systemLayout) => {
        const system = systemsById.get(systemLayout.id)
        return system ? (
          <SystemBoundary
            key={system.id}
            system={system}
            layout={systemLayout}
          />
        ) : null
      })}

      {layout.edges.map((edgeLayout) => {
        const relationship = relationshipsById.get(edgeLayout.id)
        return relationship ? (
          <RelationshipEdge
            key={relationship.id}
            relationship={relationship}
            layout={edgeLayout}
            markerIds={markerIds}
          />
        ) : null
      })}

      {layout.nodes.map((nodeLayout) => {
        if (nodeLayout.kind === 'actor') {
          const actor = actorsById.get(nodeLayout.id)
          return actor ? (
            <ActorNode key={actor.id} actor={actor} layout={nodeLayout} />
          ) : null
        }

        const useCase = useCasesById.get(nodeLayout.id)
        return useCase ? (
          <UseCaseNode key={useCase.id} useCase={useCase} layout={nodeLayout} />
        ) : null
      })}
    </svg>
  )
}
