import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { DiagramLayout } from '@/features/layout/types'
import type { UCDDocument } from '@/lib/ucd/types'

import { DiagramSvg } from './diagram-svg'

const document: UCDDocument = {
  version: 1,
  title: 'Delivery Workspace',
  actors: [{ id: 'actor-member', name: 'Team Member' }],
  useCases: [
    { id: 'use-case-review', name: 'Review Work', systemId: 'system-delivery' },
    { id: 'use-case-sign-in', name: 'Sign In', systemId: 'system-delivery' },
  ],
  systems: [{ id: 'system-delivery', name: 'Delivery' }],
  relationships: [
    {
      id: 'relationship-association',
      source: 'actor-member',
      target: 'use-case-review',
      sourceName: 'Team Member',
      targetName: 'Review Work',
      type: 'association',
    },
    {
      id: 'relationship-include',
      source: 'use-case-review',
      target: 'use-case-sign-in',
      sourceName: 'Review Work',
      targetName: 'Sign In',
      type: 'include',
      label: 'include',
    },
    {
      id: 'relationship-generalization',
      source: 'use-case-sign-in',
      target: 'use-case-review',
      sourceName: 'Sign In',
      targetName: 'Review Work',
      type: 'generalization',
    },
  ],
}

const layout: DiagramLayout = {
  width: 640,
  height: 360,
  systems: [{ id: 'system-delivery', x: 220, y: 60, width: 380, height: 260 }],
  nodes: [
    {
      id: 'actor-member',
      kind: 'actor',
      x: 40,
      y: 110,
      width: 110,
      height: 130,
    },
    {
      id: 'use-case-review',
      kind: 'use-case',
      x: 280,
      y: 120,
      width: 150,
      height: 72,
    },
    {
      id: 'use-case-sign-in',
      kind: 'use-case',
      x: 440,
      y: 220,
      width: 120,
      height: 64,
    },
  ],
  edges: [
    {
      id: 'relationship-association',
      type: 'association',
      points: [
        { x: 150, y: 170 },
        { x: 280, y: 156 },
      ],
    },
    {
      id: 'relationship-include',
      type: 'include',
      points: [
        { x: 400, y: 190 },
        { x: 470, y: 220 },
      ],
    },
    {
      id: 'relationship-generalization',
      type: 'generalization',
      points: [
        { x: 470, y: 220 },
        { x: 400, y: 190 },
      ],
    },
  ],
}

describe('DiagramSvg', () => {
  it('renders accessible UML actor, use case, and system geometry', () => {
    const markup = renderToStaticMarkup(
      <DiagramSvg document={document} layout={layout} />,
    )

    expect(markup).toContain('<title')
    expect(markup).toContain('Delivery Workspace')
    expect(markup).toContain('aria-label="Actor: Team Member"')
    expect(markup).toContain('aria-label="Use case: Review Work"')
    expect(markup).toContain('aria-label="System boundary: Delivery"')
    expect(markup).toContain('<ellipse')
    expect(markup).toContain('viewBox="0 0 640 360"')
  })

  it('uses UML-specific dependency and generalisation markers', () => {
    const markup = renderToStaticMarkup(
      <DiagramSvg document={document} layout={layout} />,
    )

    expect(markup).toContain('data-relationship-type="association"')
    expect(markup).toContain('data-relationship-type="include"')
    expect(markup).toContain('data-relationship-type="generalization"')
    expect(markup).toContain('stroke-dasharray="6 5"')
    expect(markup).toContain('«include»')
    expect(markup).toMatch(/marker-end="url\(#.+dependency-arrow\)"/)
    expect(markup).toMatch(/marker-end="url\(#.+generalization-arrow\)"/)
  })
})
