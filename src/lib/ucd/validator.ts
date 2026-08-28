import type {
  Actor,
  Relationship,
  SystemBoundary,
  UCDDocument,
  UseCase,
  ValidationIssue,
  ValidationIssueCode,
} from './types'

type DiagramElement =
  | (Actor & { kind: 'actor' })
  | (UseCase & { kind: 'use-case' })
  | (SystemBoundary & { kind: 'system' })

export function validateUCD(document: UCDDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const actorsByName = groupByName(document.actors)
  const useCasesByName = groupByName(document.useCases)
  const elementsById = createElementMap(document)
  const systemIds = new Set(document.systems.map((system) => system.id))

  addDuplicateIssues(document.actors, 'duplicate-actor', 'actor', issues)
  addDuplicateIssues(
    document.useCases,
    'duplicate-use-case',
    'use case',
    issues,
  )
  addDuplicateIssues(document.systems, 'duplicate-system', 'system', issues)
  addAmbiguousNameIssues(actorsByName, useCasesByName, issues)
  addInvalidSystemIssues(document.useCases, systemIds, issues)
  addRelationshipIssues(document.relationships, elementsById, issues)
  addDuplicateRelationshipIssues(document.relationships, issues)

  return issues
}

function addDuplicateIssues(
  elements: Array<Actor | UseCase | SystemBoundary>,
  code: ValidationIssueCode,
  elementLabel: string,
  issues: ValidationIssue[],
) {
  const seenNames = new Set<string>()

  for (const element of elements) {
    if (seenNames.has(element.name)) {
      issues.push({
        code,
        severity: 'error',
        message: `The ${elementLabel} "${element.name}" is declared more than once.`,
        source: element.source,
        elementId: element.id,
      })
    } else {
      seenNames.add(element.name)
    }
  }
}

function addAmbiguousNameIssues(
  actorsByName: Map<string, Actor[]>,
  useCasesByName: Map<string, UseCase[]>,
  issues: ValidationIssue[],
) {
  for (const [name, actors] of actorsByName) {
    if (!useCasesByName.has(name)) continue

    issues.push({
      code: 'ambiguous-reference',
      severity: 'error',
      message: `"${name}" is declared as both an actor and a use case. Rename one declaration.`,
      source: actors[0]?.source,
      elementId: actors[0]?.id,
    })
  }
}

function addInvalidSystemIssues(
  useCases: UseCase[],
  systemIds: Set<string>,
  issues: ValidationIssue[],
) {
  for (const useCase of useCases) {
    if (!useCase.systemId || systemIds.has(useCase.systemId)) continue

    issues.push({
      code: 'invalid-system-reference',
      severity: 'error',
      message: `The use case "${useCase.name}" refers to a system boundary that does not exist.`,
      source: useCase.source,
      elementId: useCase.id,
    })
  }
}

function addRelationshipIssues(
  relationships: Relationship[],
  elementsById: Map<string, DiagramElement>,
  issues: ValidationIssue[],
) {
  for (const relationship of relationships) {
    const source = elementsById.get(relationship.source)
    const target = elementsById.get(relationship.target)

    if (!source) {
      issues.push(createMissingReferenceIssue(relationship, 'source'))
    }
    if (!target) {
      issues.push(createMissingReferenceIssue(relationship, 'target'))
    }
    if (!source || !target) continue

    switch (relationship.type) {
      case 'association':
        if (source.kind !== 'actor' || target.kind !== 'use-case') {
          issues.push({
            code: 'invalid-association',
            severity: 'error',
            message: 'An association must connect an actor to a use case.',
            source: relationship.sourceRange,
            relationshipId: relationship.id,
          })
        }
        break
      case 'include':
      case 'extend':
        if (
          source.kind !== 'use-case' ||
          target.kind !== 'use-case' ||
          source.id === target.id ||
          (relationship.label !== undefined &&
            relationship.label !== relationship.type)
        ) {
          issues.push({
            code: 'invalid-dependency',
            severity: 'error',
            message: `${capitalise(relationship.type)} must connect two different use cases and use a matching label.`,
            source: relationship.sourceRange,
            relationshipId: relationship.id,
          })
        }
        break
      case 'generalization':
        if (
          (source.kind !== 'actor' && source.kind !== 'use-case') ||
          source.kind !== target.kind ||
          source.id === target.id
        ) {
          issues.push({
            code: 'invalid-generalization',
            severity: 'error',
            message:
              'Generalisation must connect two different actors or two different use cases.',
            source: relationship.sourceRange,
            relationshipId: relationship.id,
          })
        }
    }
  }
}

function addDuplicateRelationshipIssues(
  relationships: Relationship[],
  issues: ValidationIssue[],
) {
  const seenRelationships = new Set<string>()

  for (const relationship of relationships) {
    const key = [
      relationship.source,
      relationship.target,
      relationship.type,
      relationship.label ?? '',
    ].join(':')

    if (seenRelationships.has(key)) {
      issues.push({
        code: 'duplicate-relationship',
        severity: 'warning',
        message: `This ${relationship.type} relationship is declared more than once.`,
        source: relationship.sourceRange,
        relationshipId: relationship.id,
      })
    } else {
      seenRelationships.add(key)
    }
  }
}

function createMissingReferenceIssue(
  relationship: Relationship,
  endpoint: 'source' | 'target',
): ValidationIssue {
  const name =
    endpoint === 'source' ? relationship.sourceName : relationship.targetName
  return {
    code: 'missing-reference',
    severity: 'error',
    message: `The ${endpoint} "${name}" has not been declared.`,
    source: relationship.sourceRange,
    relationshipId: relationship.id,
  }
}

function createElementMap(document: UCDDocument): Map<string, DiagramElement> {
  const elements: DiagramElement[] = [
    ...document.actors.map((actor) => ({ ...actor, kind: 'actor' as const })),
    ...document.useCases.map((useCase) => ({
      ...useCase,
      kind: 'use-case' as const,
    })),
    ...document.systems.map((system) => ({
      ...system,
      kind: 'system' as const,
    })),
  ]
  return new Map(elements.map((element) => [element.id, element]))
}

function groupByName<T extends { name: string }>(
  elements: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const element of elements) {
    const group = groups.get(element.name) ?? []
    group.push(element)
    groups.set(element.name, group)
  }
  return groups
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
