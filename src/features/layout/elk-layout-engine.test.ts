import { describe, expect, it } from 'vitest'

import { productDiscoveryExample } from '@/lib/ucd/examples'
import { parseUCD } from '@/lib/ucd/parser'

import { ElkLayoutEngine } from './elk-layout-engine'

describe('ElkLayoutEngine', () => {
  it('lays out actors, system boundaries, use cases, and routed edges', async () => {
    const document = parseUCD(productDiscoveryExample).document!
    const engine = new ElkLayoutEngine()

    const layout = await engine.layout(document)

    expect(layout.width).toBeGreaterThanOrEqual(480)
    expect(layout.height).toBeGreaterThanOrEqual(320)
    expect(layout.nodes).toHaveLength(7)
    expect(layout.systems).toHaveLength(1)
    expect(layout.edges).toHaveLength(6)
    expect(layout.edges.every((edge) => edge.points.length >= 2)).toBe(true)
    expect(layout.edges.some((edge) => edge.points.length > 2)).toBe(true)

    const system = layout.systems[0]
    const containedUseCases = layout.nodes.filter(
      (node) => node.kind === 'use-case',
    )
    expect(
      containedUseCases.every(
        (node) =>
          node.x >= system.x &&
          node.y >= system.y &&
          node.x + node.width <= system.x + system.width &&
          node.y + node.height <= system.y + system.height,
      ),
    ).toBe(true)
  })

  it('respects a top-to-bottom direction hint', async () => {
    const document = parseUCD(`# Release Planning
actors:
  - Product Manager
system "Planning":
  - Publish Roadmap
Product Manager -> "Publish Roadmap"
layout:
  direction: top-to-bottom`).document!
    const engine = new ElkLayoutEngine()

    const layout = await engine.layout(document)
    const actor = layout.nodes.find((node) => node.kind === 'actor')!
    const useCase = layout.nodes.find((node) => node.kind === 'use-case')!

    expect(actor.y).toBeLessThan(useCase.y)
  })

  it('returns a stable empty canvas without invoking ELK', async () => {
    const engine = new ElkLayoutEngine()
    const layout = await engine.layout({
      version: 1,
      actors: [],
      useCases: [],
      systems: [],
      relationships: [],
    })

    expect(layout).toEqual({
      width: 480,
      height: 320,
      nodes: [],
      systems: [],
      edges: [],
    })
  })
})
