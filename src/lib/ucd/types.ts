export type SourcePosition = {
  /** One-based line number. */
  line: number
  /** One-based column number. */
  column: number
  /** Zero-based character offset in the complete source. */
  offset: number
}

export type SourceRange = {
  start: SourcePosition
  end: SourcePosition
}

export type Actor = {
  id: string
  name: string
  source?: SourceRange
}

export type UseCase = {
  id: string
  name: string
  systemId?: string
  source?: SourceRange
}

export type SystemBoundary = {
  id: string
  name: string
  source?: SourceRange
}

export type RelationshipType =
  'association' | 'include' | 'extend' | 'generalization'

export type Relationship = {
  id: string
  source: string
  target: string
  sourceName: string
  targetName: string
  type: RelationshipType
  label?: string
  sourceRange?: SourceRange
}

export type LayoutDirection =
  'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top'

export type LayoutPosition = {
  x: number
  y: number
}

export type LayoutHints = {
  direction?: LayoutDirection
  positions?: Record<string, LayoutPosition>
}

export type UCDDocument = {
  version: 1
  title?: string
  actors: Actor[]
  useCases: UseCase[]
  systems: SystemBoundary[]
  relationships: Relationship[]
  layout?: LayoutHints
}

export type ParserErrorCode =
  | 'unexpected-syntax'
  | 'unexpected-indentation'
  | 'unterminated-quote'
  | 'invalid-name'
  | 'invalid-relationship'
  | 'invalid-layout'
  | 'duplicate-title'

export type ParserError = {
  code: ParserErrorCode
  message: string
  line: number
  column: number
  endColumn?: number
  hint?: string
}

export type TitleSyntaxNode = {
  kind: 'title'
  title: string
  range: SourceRange
}

export type NamedDeclarationSyntaxNode = {
  kind: 'actor' | 'use-case'
  name: string
  systemName?: string
  range: SourceRange
}

export type SystemSyntaxNode = {
  kind: 'system'
  name: string
  range: SourceRange
}

export type RelationshipSyntaxNode = {
  kind: 'relationship'
  sourceName: string
  targetName: string
  relationshipType: RelationshipType
  label?: string
  range: SourceRange
}

export type LayoutDirectionSyntaxNode = {
  kind: 'layout-direction'
  direction: LayoutDirection
  range: SourceRange
}

export type LayoutPositionSyntaxNode = {
  kind: 'layout-position'
  elementName: string
  position: LayoutPosition
  range: SourceRange
}

export type UCDSyntaxNode =
  | TitleSyntaxNode
  | NamedDeclarationSyntaxNode
  | SystemSyntaxNode
  | RelationshipSyntaxNode
  | LayoutDirectionSyntaxNode
  | LayoutPositionSyntaxNode

export type UCDSyntaxTree = {
  kind: 'document'
  children: UCDSyntaxNode[]
  range: SourceRange
}

export type ParseUCDResult = {
  document?: UCDDocument
  ast?: UCDSyntaxTree
  errors: ParserError[]
}

export type ValidationIssueCode =
  | 'duplicate-actor'
  | 'duplicate-use-case'
  | 'duplicate-system'
  | 'duplicate-relationship'
  | 'missing-reference'
  | 'ambiguous-reference'
  | 'invalid-association'
  | 'invalid-dependency'
  | 'invalid-generalization'
  | 'invalid-system-reference'
  | 'unused-actor'

export type ValidationIssue = {
  code: ValidationIssueCode
  message: string
  severity: 'error' | 'warning'
  source?: SourceRange
  relationshipId?: string
  elementId?: string
}
