import { describe, expect, it } from 'vitest'

import { productDiscoveryExample } from './examples'
import { parseUCD } from './parser'
import type { Relationship, UCDDocument } from './types'
import { validateUCD } from './validator'

describe('validateUCD', () => {
  it('accepts a semantically valid parsed document', () => {
    const parsed = parseUCD(productDiscoveryExample)

    expect(parsed.document).toBeDefined()
    expect(validateUCD(parsed.document!)).toEqual([])
  })

  it('reports duplicate declarations and ambiguous names', () => {
    const parsed = parseUCD(`actors:
  - Team Member
  - Team Member
  - Review Work
system "Delivery":
  - Review Work
system "Delivery":
  - Publish Work
use cases:
  - Publish Work`)

    const issues = validateUCD(parsed.document!)

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'duplicate-actor' }),
        expect.objectContaining({ code: 'duplicate-use-case' }),
        expect.objectContaining({ code: 'duplicate-system' }),
        expect.objectContaining({ code: 'ambiguous-reference' }),
      ]),
    )
  })

  it('reports references to undeclared elements', () => {
    const parsed = parseUCD(`actors:
  - Product Manager
use cases:
  - Review Evidence
Designer -> "Review Evidence"
Product Manager -> "Capture Opportunity"`)

    expect(validateUCD(parsed.document!)).toEqual([
      expect.objectContaining({
        code: 'missing-reference',
        message: 'The source "Designer" has not been declared.',
      }),
      expect.objectContaining({
        code: 'missing-reference',
        message: 'The target "Capture Opportunity" has not been declared.',
      }),
    ])
  })

  it('reports invalid endpoint types for each relationship family', () => {
    const document = createDocument({
      relationships: [
        relationship('association', 'use-case-review', 'actor-member'),
        relationship('include', 'actor-member', 'use-case-review', 'include'),
        relationship('generalization', 'actor-member', 'use-case-review'),
      ],
    })

    expect(validateUCD(document)).toEqual([
      expect.objectContaining({ code: 'invalid-association' }),
      expect.objectContaining({ code: 'invalid-dependency' }),
      expect.objectContaining({ code: 'invalid-generalization' }),
    ])
  })

  it('rejects self-dependencies and self-generalisation', () => {
    const document = createDocument({
      relationships: [
        relationship('extend', 'use-case-review', 'use-case-review', 'extend'),
        relationship('generalization', 'actor-member', 'actor-member'),
      ],
    })

    expect(validateUCD(document)).toEqual([
      expect.objectContaining({ code: 'invalid-dependency' }),
      expect.objectContaining({ code: 'invalid-generalization' }),
    ])
  })

  it('rejects generalisation between system boundaries', () => {
    const document = createDocument({
      relationships: [
        relationship('generalization', 'system-delivery', 'system-planning'),
      ],
    })
    document.systems = [
      { id: 'system-delivery', name: 'Delivery' },
      { id: 'system-planning', name: 'Planning' },
    ]

    expect(validateUCD(document)).toEqual([
      expect.objectContaining({ code: 'invalid-generalization' }),
    ])
  })

  it('reports missing systems and duplicate relationships', () => {
    const duplicate = relationship(
      'association',
      'actor-member',
      'use-case-review',
    )
    const document = createDocument({
      useCaseSystemId: 'system-missing',
      relationships: [
        duplicate,
        { ...duplicate, id: 'relationship-duplicate' },
      ],
    })

    expect(validateUCD(document)).toEqual([
      expect.objectContaining({ code: 'invalid-system-reference' }),
      expect.objectContaining({
        code: 'duplicate-relationship',
        severity: 'warning',
      }),
    ])
  })
})

function createDocument({
  relationships,
  useCaseSystemId,
}: {
  relationships: Relationship[]
  useCaseSystemId?: string
}): UCDDocument {
  return {
    version: 1,
    actors: [{ id: 'actor-member', name: 'Team Member' }],
    useCases: [
      {
        id: 'use-case-review',
        name: 'Review Work',
        ...(useCaseSystemId ? { systemId: useCaseSystemId } : {}),
      },
    ],
    systems: [],
    relationships,
  }
}

function relationship(
  type: Relationship['type'],
  source: string,
  target: string,
  label?: string,
): Relationship {
  return {
    id: `relationship-${type}-${source}-${target}`,
    source,
    target,
    sourceName: source,
    targetName: target,
    type,
    ...(label ? { label } : {}),
  }
}
