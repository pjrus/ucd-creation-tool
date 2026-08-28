import { describe, expect, it } from 'vitest'

import { productDiscoveryExample } from './examples'
import { parseUCD } from './parser'

describe('parseUCD', () => {
  it('parses the complete product discovery fixture', () => {
    const result = parseUCD(productDiscoveryExample)

    expect(result.errors).toEqual([])
    expect(result.document).toMatchObject({
      version: 1,
      title: 'Product Discovery Workspace',
    })
    expect(result.document?.actors.map((actor) => actor.name)).toEqual([
      'Product Manager',
      'Designer',
      'Stakeholder',
    ])
    expect(result.document?.systems).toHaveLength(1)
    expect(result.document?.useCases).toHaveLength(4)
    expect(result.document?.relationships).toHaveLength(6)
    expect(result.document?.relationships.at(-1)).toMatchObject({
      sourceName: 'Prioritise Opportunity',
      targetName: 'Review Evidence',
      type: 'include',
      label: 'include',
    })
  })

  it('parses standalone use cases, comments, and single-line associations', () => {
    const result = parseUCD(`# Account Access
// Kept outside a system boundary on purpose.
actors:
  - Team Member

use cases:
  - Sign In

Team Member -> "Sign In"`)

    expect(result.errors).toEqual([])
    expect(result.document?.useCases[0]).toMatchObject({
      id: 'use-case-sign-in',
      name: 'Sign In',
    })
    expect(result.document?.relationships[0]).toMatchObject({
      source: 'actor-team-member',
      target: 'use-case-sign-in',
      type: 'association',
    })
  })

  it('parses include, extend, and actor and use-case generalisation', () => {
    const result = parseUCD(`# Delivery Workspace
actors:
  - Team Member
  - Administrator

system "Delivery":
  - Review Work
  - Review Urgent Work
  - Sign In
  - Add Context

Administrator --|> "Team Member"
"Review Urgent Work" --|> "Review Work"
"Review Work" ..> "Sign In" : INCLUDE
"Add Context" ..> "Review Work" : extend`)

    expect(result.errors).toEqual([])
    expect(
      result.document?.relationships.map((relationship) => relationship.type),
    ).toEqual(['generalization', 'generalization', 'include', 'extend'])
    expect(result.document?.relationships[1]).toMatchObject({
      source: 'use-case-review-urgent-work',
      target: 'use-case-review-work',
    })
  })

  it('parses layout direction and fixed positions', () => {
    const result = parseUCD(`# Opportunity Map
actors:
  - Product Manager
system "Discovery":
  - Capture Opportunity
layout:
  direction: left-to-right
  "Product Manager": 40, 120
  "Capture Opportunity": 320.5, -20`)

    expect(result.errors).toEqual([])
    expect(result.document?.layout).toEqual({
      direction: 'left-to-right',
      positions: {
        'actor-product-manager': { x: 40, y: 120 },
        'use-case-capture-opportunity': { x: 320.5, y: -20 },
      },
    })
  })

  it('supports escaped quotes inside quoted names', () => {
    const result = parseUCD(`actors:
  - "Release \\"Captain\\""
use cases:
  - Approve Release
"Release \\"Captain\\"" -> "Approve Release"`)

    expect(result.errors).toEqual([])
    expect(result.document?.actors[0]?.name).toBe('Release "Captain"')
  })

  it('returns useful syntax errors with one-based line references', () => {
    const result = parseUCD(`# First title
# Second title
actors:
   - Misaligned
system "Unclosed:
Unknown syntax`)

    expect(result.document).toBeUndefined()
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'duplicate-title',
          line: 2,
          column: 1,
        }),
        expect.objectContaining({
          code: 'unexpected-indentation',
          line: 4,
          column: 1,
        }),
        expect.objectContaining({ code: 'unterminated-quote', line: 5 }),
        expect.objectContaining({
          code: 'unexpected-syntax',
          line: 6,
          column: 1,
        }),
      ]),
    )
    expect(result.ast?.children[0]).toMatchObject({
      kind: 'title',
      title: 'First title',
    })
  })

  it('reports invalid dependency labels and layout values', () => {
    const result = parseUCD(`use cases:
  - Publish Roadmap
  - Review Roadmap
"Publish Roadmap" ..> "Review Roadmap" : requires
layout:
  direction: diagonal
  "Publish Roadmap": left, 20`)

    expect(result.document).toBeUndefined()
    expect(result.errors).toEqual([
      expect.objectContaining({ code: 'invalid-relationship', line: 4 }),
      expect.objectContaining({ code: 'invalid-layout', line: 6 }),
      expect.objectContaining({ code: 'invalid-layout', line: 7 }),
    ])
  })
})
