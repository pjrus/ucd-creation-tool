import ELK from 'elkjs/lib/elk.bundled.js'
import type {
  ElkExtendedEdge,
  ElkNode,
  ElkPoint,
} from 'elkjs/lib/elk.bundled.js'

import type {
  LayoutDirection,
  Relationship,
  UCDDocument,
  UseCase,
} from '@/lib/ucd/types'

import type {
  DiagramEdgeLayout,
  DiagramLayout,
  DiagramLayoutEngine,
  DiagramNodeLayout,
  DiagramPoint,
  DiagramSystemLayout,
} from './types'

const actorHeight = 132
const systemHeaderHeight = 44
const minimumCanvasWidth = 480
const minimumCanvasHeight = 320

export class ElkLayoutEngine implements DiagramLayoutEngine {
  private readonly elk = new ELK()

  async layout(document: UCDDocument): Promise<DiagramLayout> {
    if (document.actors.length === 0 && document.useCases.length === 0) {
      return {
        width: minimumCanvasWidth,
        height: minimumCanvasHeight,
        nodes: [],
        systems: document.systems.map((system, index) => ({
          id: system.id,
          x: 32 + index * 260,
          y: document.title ? 56 : 24,
          width: 228,
          height: 124,
        })),
        edges: [],
      }
    }

    const graph = createElkGraph(document)
    const result = await this.elk.layout(graph)
    return toDiagramLayout(document, result)
  }
}

export const elkLayoutEngine = new ElkLayoutEngine()

function createElkGraph(document: UCDDocument): ElkNode {
  const useCasesBySystem = groupUseCasesBySystem(document.useCases)
  const systemIds = new Set(document.systems.map((system) => system.id))
  const children: ElkNode[] = [
    ...document.actors.map(createActorNode),
    ...document.useCases
      .filter(
        (useCase) => !useCase.systemId || !systemIds.has(useCase.systemId),
      )
      .map(createUseCaseNode),
    ...document.systems.map((system) => {
      const systemUseCases = useCasesBySystem.get(system.id) ?? []
      return {
        id: system.id,
        ...(systemUseCases.length > 0
          ? { children: systemUseCases.map(createUseCaseNode) }
          : { width: 228, height: 124 }),
        layoutOptions: {
          'elk.padding': `[top=${systemHeaderHeight},left=28,bottom=28,right=28]`,
          'elk.spacing.nodeNode': '38',
        },
      }
    }),
  ]

  return {
    id: 'ucd-root',
    children,
    edges: document.relationships.map(createElkEdge),
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': toElkDirection(document.layout?.direction),
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.spacing.nodeNodeBetweenLayers': '92',
      'elk.spacing.edgeNode': '28',
      'elk.spacing.nodeNode': '56',
      'elk.padding': document.title
        ? '[top=58,left=32,bottom=32,right=32]'
        : '[top=32,left=32,bottom=32,right=32]',
    },
  }
}

function createActorNode(actor: UCDDocument['actors'][number]): ElkNode {
  return {
    id: actor.id,
    width: Math.max(108, Math.min(188, actor.name.length * 7 + 28)),
    height: actorHeight,
  }
}

function createUseCaseNode(useCase: UseCase): ElkNode {
  const width = Math.max(138, Math.min(260, useCase.name.length * 7.2 + 48))
  return {
    id: useCase.id,
    width,
    height: useCase.name.length > 24 ? 76 : 66,
  }
}

function createElkEdge(relationship: Relationship): ElkExtendedEdge {
  const hasLabel =
    relationship.type === 'include' || relationship.type === 'extend'
  const label = hasLabel ? `«${relationship.type}»` : relationship.label

  return {
    id: relationship.id,
    sources: [relationship.source],
    targets: [relationship.target],
    ...(label
      ? {
          labels: [
            {
              id: `${relationship.id}-label`,
              text: label,
              width: label.length * 7.4 + 12,
              height: 20,
            },
          ],
        }
      : {}),
  }
}

function toDiagramLayout(
  document: UCDDocument,
  result: ElkNode,
): DiagramLayout {
  const nodes: DiagramNodeLayout[] = []
  const systems: DiagramSystemLayout[] = []
  const actorIds = new Set(document.actors.map((actor) => actor.id))
  const useCaseIds = new Set(document.useCases.map((useCase) => useCase.id))
  const systemIds = new Set(document.systems.map((system) => system.id))

  for (const child of result.children ?? []) {
    collectNodeLayouts(
      child,
      { x: 0, y: 0 },
      actorIds,
      useCaseIds,
      systemIds,
      nodes,
      systems,
    )
  }

  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const relationshipsById = new Map(
    document.relationships.map((relationship) => [
      relationship.id,
      relationship,
    ]),
  )
  const edges = (result.edges ?? []).flatMap((edge) => {
    const relationship = relationshipsById.get(edge.id)
    return relationship ? [toDiagramEdge(edge, relationship, nodesById)] : []
  })

  return {
    width: Math.max(minimumCanvasWidth, result.width ?? minimumCanvasWidth),
    height: Math.max(minimumCanvasHeight, result.height ?? minimumCanvasHeight),
    nodes,
    systems,
    edges,
  }
}

function collectNodeLayouts(
  node: ElkNode,
  parentOffset: DiagramPoint,
  actorIds: Set<string>,
  useCaseIds: Set<string>,
  systemIds: Set<string>,
  nodes: DiagramNodeLayout[],
  systems: DiagramSystemLayout[],
) {
  const x = parentOffset.x + (node.x ?? 0)
  const y = parentOffset.y + (node.y ?? 0)
  const width = node.width ?? 0
  const height = node.height ?? 0

  if (systemIds.has(node.id)) {
    systems.push({ id: node.id, x, y, width, height })
  } else if (actorIds.has(node.id) || useCaseIds.has(node.id)) {
    nodes.push({
      id: node.id,
      kind: actorIds.has(node.id) ? 'actor' : 'use-case',
      x,
      y,
      width,
      height,
    })
  }

  for (const child of node.children ?? []) {
    collectNodeLayouts(
      child,
      { x, y },
      actorIds,
      useCaseIds,
      systemIds,
      nodes,
      systems,
    )
  }
}

function toDiagramEdge(
  edge: ElkExtendedEdge,
  relationship: Relationship,
  nodesById: Map<string, DiagramNodeLayout>,
): DiagramEdgeLayout {
  const points = edge.sections?.flatMap(sectionToPoints) ?? []
  const sourceNode = nodesById.get(relationship.source)
  const targetNode = nodesById.get(relationship.target)
  const fallbackPoints =
    sourceNode && targetNode
      ? [centreOf(sourceNode), centreOf(targetNode)]
      : [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ]
  const label = edge.labels?.[0]

  return {
    id: edge.id,
    type: relationship.type,
    points:
      points.length >= 2 ? removeAdjacentDuplicates(points) : fallbackPoints,
    ...(label?.x !== undefined && label.y !== undefined
      ? {
          labelPosition: {
            x: label.x + (label.width ?? 0) / 2,
            y: label.y + (label.height ?? 0) / 2,
          },
        }
      : {}),
  }
}

function sectionToPoints(
  section: NonNullable<ElkExtendedEdge['sections']>[number],
): ElkPoint[] {
  return [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]
}

function removeAdjacentDuplicates(points: DiagramPoint[]): DiagramPoint[] {
  return points.filter((point, index) => {
    if (index === 0) return true
    const previous = points[index - 1]
    return previous.x !== point.x || previous.y !== point.y
  })
}

function centreOf(node: DiagramNodeLayout): DiagramPoint {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  }
}

function groupUseCasesBySystem(useCases: UseCase[]): Map<string, UseCase[]> {
  const groups = new Map<string, UseCase[]>()
  for (const useCase of useCases) {
    if (!useCase.systemId) continue
    const group = groups.get(useCase.systemId) ?? []
    group.push(useCase)
    groups.set(useCase.systemId, group)
  }
  return groups
}

function toElkDirection(direction: LayoutDirection | undefined): string {
  switch (direction) {
    case 'right-to-left':
      return 'LEFT'
    case 'top-to-bottom':
      return 'DOWN'
    case 'bottom-to-top':
      return 'UP'
    default:
      return 'RIGHT'
  }
}
