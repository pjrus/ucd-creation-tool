import { useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
} from 'react'

import { cn } from '@/lib/utils'

export type ResizableSplitProps = {
  first: ReactNode
  second: ReactNode
  firstLabel: string
  secondLabel: string
  className?: string
  defaultSplit?: number
}

export function ResizableSplit({
  first,
  second,
  firstLabel,
  secondLabel,
  className,
  defaultSplit = 48,
}: ResizableSplitProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [split, setSplit] = useState(defaultSplit)
  const [isDragging, setIsDragging] = useState(false)
  const isHorizontal = useDesktopSplit()
  const style = { '--editor-split': `${split}%` } as CSSProperties

  const updateFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return

    const position = isHorizontal
      ? (event.clientX - bounds.left) / bounds.width
      : (event.clientY - bounds.top) / bounds.height
    setSplit(clampSplit(position * 100))
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
    updateFromPointer(event)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (isDragging) updateFromPointer(event)
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setIsDragging(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const change = event.shiftKey ? 10 : 2
    const decreaseKeys = isHorizontal ? ['ArrowLeft'] : ['ArrowUp']
    const increaseKeys = isHorizontal ? ['ArrowRight'] : ['ArrowDown']

    if (decreaseKeys.includes(event.key)) {
      event.preventDefault()
      setSplit((current) => clampSplit(current - change))
    } else if (increaseKeys.includes(event.key)) {
      event.preventDefault()
      setSplit((current) => clampSplit(current + change))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setSplit(30)
    } else if (event.key === 'End') {
      event.preventDefault()
      setSplit(70)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn('editor-split min-h-0 flex-1', className)}
      style={style}
    >
      <section
        aria-label={firstLabel}
        className="min-h-0 min-w-0 overflow-hidden"
      >
        {first}
      </section>
      <div
        role="separator"
        tabIndex={0}
        aria-label={`Resize ${firstLabel} and ${secondLabel}`}
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        aria-valuemin={30}
        aria-valuemax={70}
        aria-valuenow={Math.round(split)}
        className={cn(
          'editor-resize-handle group',
          isDragging && 'is-dragging',
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <span aria-hidden="true" />
      </div>
      <section
        aria-label={secondLabel}
        className="min-h-0 min-w-0 overflow-hidden"
      >
        {second}
      </section>
    </div>
  )
}

function clampSplit(value: number): number {
  return Math.min(70, Math.max(30, value))
}

function useDesktopSplit() {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const update = () => setMatches(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return matches
}
