import { lexUCD } from './lexer'
import type { LineToken } from './lexer'
import type {
  Actor,
  LayoutDirection,
  LayoutHints,
  LayoutPosition,
  NamedDeclarationSyntaxNode,
  ParseUCDResult,
  ParserError,
  Relationship,
  RelationshipSyntaxNode,
  RelationshipType,
  SourceRange,
  SystemBoundary,
  UCDSyntaxNode,
  UseCase,
} from './types'

type BlockContext =
  | { kind: 'actors' }
  | { kind: 'use-cases' }
  | { kind: 'system'; name: string; id: string }
  | { kind: 'actor-associations'; actorName: string }
  | { kind: 'layout' }

type PendingRelationship = {
  sourceName: string
  targetName: string
  type: RelationshipType
  label?: string
  range: SourceRange
}

type PendingLayoutPosition = {
  elementName: string
  position: LayoutPosition
}

const relationshipOperators = ['--|>', '..>', '->'] as const
const layoutDirections = new Set<LayoutDirection>([
  'left-to-right',
  'right-to-left',
  'top-to-bottom',
  'bottom-to-top',
])

export function parseUCD(source: string): ParseUCDResult {
  const lexed = lexUCD(source)
  const errors = [...lexed.errors]
  const astChildren: UCDSyntaxNode[] = []
  const actors: Actor[] = []
  const useCases: UseCase[] = []
  const systems: SystemBoundary[] = []
  const pendingRelationships: PendingRelationship[] = []
  const pendingPositions: PendingLayoutPosition[] = []
  let layoutDirection: LayoutDirection | undefined
  let title: string | undefined
  let context: BlockContext | undefined

  for (const token of lexed.tokens) {
    if (token.kind !== 'content') continue

    if (token.indent > 0) {
      parseNestedLine(token, context)
      continue
    }

    context = undefined

    if (token.text.startsWith('#')) {
      parseTitle(token)
      continue
    }

    if (token.text === 'actors:') {
      context = { kind: 'actors' }
      continue
    }

    if (token.text === 'use cases:') {
      context = { kind: 'use-cases' }
      continue
    }

    if (token.text === 'layout:') {
      context = { kind: 'layout' }
      continue
    }

    if (token.text.startsWith('system ')) {
      const systemNameSource = token.text.slice('system '.length, -1)
      if (!token.text.endsWith(':')) {
        addError(
          token,
          'unexpected-syntax',
          'A system declaration must end with a colon.',
          {
            hint: 'For example: system "Ordering":',
          },
        )
        continue
      }

      const name = parseName(systemNameSource, token)
      if (!name) continue

      const id = createElementId('system', name)
      systems.push({ id, name, source: token.range })
      astChildren.push({ kind: 'system', name, range: token.range })
      context = { kind: 'system', name, id }
      continue
    }

    const relationship = parseRelationship(token)
    if (relationship !== undefined) {
      if (relationship) {
        pendingRelationships.push(relationship)
        astChildren.push(toRelationshipSyntaxNode(relationship))
      }
      continue
    }

    if (token.text.endsWith(':')) {
      const actorName = parseName(token.text.slice(0, -1), token)
      if (actorName) context = { kind: 'actor-associations', actorName }
      continue
    }

    addError(
      token,
      'unexpected-syntax',
      'This line does not match UCD syntax.',
      {
        hint: 'Declare a block or use a supported relationship arrow.',
      },
    )
  }

  const actorIds = createElementMap(actors)
  const useCaseIds = createElementMap(useCases)
  const systemIds = createElementMap(systems)
  const relationships = pendingRelationships.map((relationship, index) =>
    resolveRelationship(relationship, index, actorIds, useCaseIds),
  )
  const layout = createLayout(
    layoutDirection,
    pendingPositions,
    actorIds,
    useCaseIds,
    systemIds,
  )
  const ast = {
    kind: 'document' as const,
    children: astChildren,
    range: {
      start: { line: 1, column: 1, offset: 0 },
      end: lexed.end,
    },
  }

  return {
    document:
      errors.length === 0
        ? {
            version: 1,
            ...(title ? { title } : {}),
            actors,
            useCases,
            systems,
            relationships,
            ...(layout ? { layout } : {}),
          }
        : undefined,
    ast,
    errors,
  }

  function parseTitle(token: LineToken) {
    if (!token.text.startsWith('# ')) {
      addError(token, 'unexpected-syntax', 'A title must start with "# ".')
      return
    }

    const parsedTitle = token.text.slice(2).trim()
    if (!parsedTitle) {
      addError(token, 'invalid-name', 'The document title cannot be empty.')
      return
    }

    if (title) {
      addError(token, 'duplicate-title', 'Only one document title is allowed.')
      return
    }

    title = parsedTitle
    astChildren.push({ kind: 'title', title, range: token.range })
  }

  function parseNestedLine(
    token: LineToken,
    activeContext: BlockContext | undefined,
  ) {
    if (token.indent !== 2) {
      addError(
        token,
        'unexpected-indentation',
        'Nested lines must use two spaces.',
        {
          column: 1,
          endColumn: token.contentColumn,
          hint: 'Align this line two spaces inside its block.',
        },
      )
      return
    }

    if (!activeContext) {
      addError(
        token,
        'unexpected-indentation',
        'This indented line is not inside a block.',
        {
          hint: 'Remove the indentation or add a block declaration above it.',
        },
      )
      return
    }

    switch (activeContext.kind) {
      case 'actors':
      case 'use-cases':
      case 'system': {
        if (!token.text.startsWith('- ')) {
          addError(
            token,
            'unexpected-syntax',
            'Declarations inside this block must start with "- ".',
          )
          return
        }

        const name = parseName(token.text.slice(2), token)
        if (!name) return

        if (activeContext.kind === 'actors') {
          const actor: Actor = {
            id: createElementId('actor', name),
            name,
            source: token.range,
          }
          actors.push(actor)
          astChildren.push(createDeclarationNode('actor', name, token.range))
          return
        }

        const useCase: UseCase = {
          id: createElementId('use-case', name),
          name,
          ...(activeContext.kind === 'system'
            ? { systemId: activeContext.id }
            : {}),
          source: token.range,
        }
        useCases.push(useCase)
        astChildren.push(
          createDeclarationNode(
            'use-case',
            name,
            token.range,
            activeContext.kind === 'system' ? activeContext.name : undefined,
          ),
        )
        return
      }
      case 'actor-associations': {
        if (!token.text.startsWith('->')) {
          addError(
            token,
            'invalid-relationship',
            'Actor relationships must start with "->".',
          )
          return
        }

        const targetName = parseName(token.text.slice(2), token)
        if (!targetName) return

        const pending: PendingRelationship = {
          sourceName: activeContext.actorName,
          targetName,
          type: 'association',
          range: token.range,
        }
        pendingRelationships.push(pending)
        astChildren.push(toRelationshipSyntaxNode(pending))
        return
      }
      case 'layout':
        parseLayoutLine(token)
    }
  }

  function parseLayoutLine(token: LineToken) {
    const colonIndex = findOutsideQuotes(token.text, ':')
    if (colonIndex < 0) {
      addError(token, 'invalid-layout', 'A layout entry must contain a colon.')
      return
    }

    const keySource = token.text.slice(0, colonIndex).trim()
    const value = token.text.slice(colonIndex + 1).trim()

    if (keySource === 'direction') {
      if (!layoutDirections.has(value as LayoutDirection)) {
        addError(
          token,
          'invalid-layout',
          `"${value}" is not a supported layout direction.`,
          {
            hint: 'Use left-to-right, right-to-left, top-to-bottom, or bottom-to-top.',
          },
        )
        return
      }

      layoutDirection = value as LayoutDirection
      astChildren.push({
        kind: 'layout-direction',
        direction: layoutDirection,
        range: token.range,
      })
      return
    }

    const elementName = parseName(keySource, token)
    const coordinates = value.split(',').map((part) => Number(part.trim()))
    if (
      !elementName ||
      coordinates.length !== 2 ||
      coordinates.some((coordinate) => !Number.isFinite(coordinate))
    ) {
      addError(
        token,
        'invalid-layout',
        'A fixed position must contain two numeric coordinates.',
        {
          hint: 'For example: "Product Manager": 40, 120',
        },
      )
      return
    }

    const position = { x: coordinates[0], y: coordinates[1] }
    pendingPositions.push({ elementName, position })
    astChildren.push({
      kind: 'layout-position',
      elementName,
      position,
      range: token.range,
    })
  }

  function addError(
    token: LineToken,
    code: ParserError['code'],
    message: string,
    options: { column?: number; endColumn?: number; hint?: string } = {},
  ) {
    errors.push({
      code,
      message,
      line: token.line,
      column: options.column ?? token.contentColumn,
      endColumn: options.endColumn ?? token.raw.length + 1,
      ...(options.hint ? { hint: options.hint } : {}),
    })
  }

  function parseName(sourceName: string, token: LineToken): string | undefined {
    const trimmed = sourceName.trim()
    if (!trimmed) {
      addError(token, 'invalid-name', 'Names cannot be empty.')
      return undefined
    }

    if (!trimmed.startsWith('"')) {
      if (trimmed.includes('"')) {
        addError(token, 'invalid-name', 'Quotes must wrap the complete name.')
        return undefined
      }
      return trimmed
    }

    const closingQuote = findClosingQuote(trimmed)
    if (closingQuote < 0) return undefined

    if (trimmed.slice(closingQuote + 1).trim()) {
      addError(
        token,
        'invalid-name',
        'Unexpected text follows this quoted name.',
      )
      return undefined
    }

    const unescaped = trimmed
      .slice(1, closingQuote)
      .replaceAll('\\"', '"')
      .replaceAll('\\\\', '\\')

    if (!unescaped.trim()) {
      addError(token, 'invalid-name', 'Names cannot be empty.')
      return undefined
    }

    return unescaped
  }

  function parseRelationship(
    token: LineToken,
  ): PendingRelationship | null | undefined {
    const operatorMatch = relationshipOperators
      .map((operator) => ({
        operator,
        index: findOutsideQuotes(token.text, operator),
      }))
      .find(({ index }) => index >= 0)
    if (!operatorMatch) return undefined

    const { operator, index } = operatorMatch
    const sourceName = parseName(token.text.slice(0, index), token)
    const targetAndLabel = token.text.slice(index + operator.length).trim()
    if (!sourceName) return null

    if (operator === '..>') {
      const labelSeparator = findOutsideQuotes(targetAndLabel, ':')
      if (labelSeparator < 0) {
        addError(
          token,
          'invalid-relationship',
          'A dashed relationship requires an include or extend label.',
          {
            hint: 'For example: "Place Order" ..> "Sign In" : include',
          },
        )
        return null
      }

      const targetName = parseName(
        targetAndLabel.slice(0, labelSeparator),
        token,
      )
      const label = targetAndLabel
        .slice(labelSeparator + 1)
        .trim()
        .toLowerCase()
      if (!targetName) return null
      if (label !== 'include' && label !== 'extend') {
        addError(
          token,
          'invalid-relationship',
          `"${label}" is not a supported dependency type.`,
          {
            hint: 'Use include or extend.',
          },
        )
        return null
      }

      return {
        sourceName,
        targetName,
        type: label,
        label,
        range: token.range,
      }
    }

    const targetName = parseName(targetAndLabel, token)
    if (!targetName) return null

    return {
      sourceName,
      targetName,
      type: operator === '->' ? 'association' : 'generalization',
      range: token.range,
    }
  }
}

function createDeclarationNode(
  kind: 'actor' | 'use-case',
  name: string,
  range: SourceRange,
  systemName?: string,
): NamedDeclarationSyntaxNode {
  return {
    kind,
    name,
    ...(systemName ? { systemName } : {}),
    range,
  }
}

function toRelationshipSyntaxNode(
  relationship: PendingRelationship,
): RelationshipSyntaxNode {
  return {
    kind: 'relationship',
    sourceName: relationship.sourceName,
    targetName: relationship.targetName,
    relationshipType: relationship.type,
    ...(relationship.label ? { label: relationship.label } : {}),
    range: relationship.range,
  }
}

function createElementMap(
  elements: Array<{ id: string; name: string }>,
): Map<string, string> {
  const map = new Map<string, string>()
  for (const element of elements) {
    if (!map.has(element.name)) map.set(element.name, element.id)
  }
  return map
}

function resolveRelationship(
  relationship: PendingRelationship,
  index: number,
  actorIds: Map<string, string>,
  useCaseIds: Map<string, string>,
): Relationship {
  const { sourceName, targetName, type } = relationship
  let source: string
  let target: string

  if (type === 'association') {
    source =
      actorIds.get(sourceName) ?? createElementId('reference', sourceName)
    target =
      useCaseIds.get(targetName) ?? createElementId('reference', targetName)
  } else if (type === 'include' || type === 'extend') {
    source =
      useCaseIds.get(sourceName) ?? createElementId('reference', sourceName)
    target =
      useCaseIds.get(targetName) ?? createElementId('reference', targetName)
  } else {
    const prefersActors = actorIds.has(sourceName) || actorIds.has(targetName)
    const elementIds = prefersActors ? actorIds : useCaseIds
    source =
      elementIds.get(sourceName) ?? createElementId('reference', sourceName)
    target =
      elementIds.get(targetName) ?? createElementId('reference', targetName)
  }

  return {
    id: createRelationshipId(type, sourceName, targetName, index),
    source,
    target,
    sourceName,
    targetName,
    type,
    ...(relationship.label ? { label: relationship.label } : {}),
    sourceRange: relationship.range,
  }
}

function createLayout(
  direction: LayoutDirection | undefined,
  pendingPositions: PendingLayoutPosition[],
  ...elementMaps: Array<Map<string, string>>
): LayoutHints | undefined {
  if (!direction && pendingPositions.length === 0) return undefined

  const positions: Record<string, LayoutPosition> = {}
  for (const pending of pendingPositions) {
    const id =
      elementMaps.map((map) => map.get(pending.elementName)).find(Boolean) ??
      createElementId('reference', pending.elementName)
    positions[id] = pending.position
  }

  return {
    ...(direction ? { direction } : {}),
    ...(Object.keys(positions).length > 0 ? { positions } : {}),
  }
}

function findOutsideQuotes(source: string, search: string): number {
  let isQuoted = false
  let isEscaped = false

  for (let index = 0; index <= source.length - search.length; index += 1) {
    const character = source[index]
    if (isEscaped) {
      isEscaped = false
      continue
    }
    if (character === '\\') {
      isEscaped = true
      continue
    }
    if (character === '"') {
      isQuoted = !isQuoted
      continue
    }
    if (!isQuoted && source.startsWith(search, index)) return index
  }

  return -1
}

function findClosingQuote(source: string): number {
  let isEscaped = false
  for (let index = 1; index < source.length; index += 1) {
    const character = source[index]
    if (isEscaped) {
      isEscaped = false
      continue
    }
    if (character === '\\') {
      isEscaped = true
      continue
    }
    if (character === '"') return index
  }
  return -1
}

function createElementId(kind: string, name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${kind}-${slug || 'element'}`
}

function createRelationshipId(
  type: RelationshipType,
  sourceName: string,
  targetName: string,
  index: number,
): string {
  return createElementId(
    'relationship',
    `${type}-${sourceName}-${targetName}-${index + 1}`,
  )
}
