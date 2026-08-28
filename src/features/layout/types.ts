import type { RelationshipType, UCDDocument } from '@/lib/ucd/types'

export type DiagramPoint = {
  x: number
  y: number
}

export type DiagramNodeKind = 'actor' | 'use-case'

export type DiagramNodeLayout = {
  id: string
  kind: DiagramNodeKind
  x: number
  y: number
  width: number
  height: number
}

export type DiagramSystemLayout = {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export type DiagramEdgeLayout = {
  id: string
  type: RelationshipType
  points: DiagramPoint[]
  labelPosition?: DiagramPoint
}

export type DiagramLayout = {
  width: number
  height: number
  nodes: DiagramNodeLayout[]
  systems: DiagramSystemLayout[]
  edges: DiagramEdgeLayout[]
}

export type DiagramLayoutEngine = {
  layout: (document: UCDDocument) => Promise<DiagramLayout>
}
