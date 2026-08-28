import { wrapSvgLabel } from '@/features/renderer/text'

export type SvgTextLabelProps = {
  label: string
  x: number
  y: number
  maxCharacters: number
  lineHeight?: number
  className?: string
}

export function SvgTextLabel({
  label,
  x,
  y,
  maxCharacters,
  lineHeight = 16,
  className,
}: SvgTextLabelProps) {
  const lines = wrapSvgLabel(label, maxCharacters)
  const firstLineOffset = -((lines.length - 1) * lineHeight) / 2

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      className={className}
    >
      {lines.map((line, index) => (
        <tspan
          key={`${line}-${index}`}
          x={x}
          dy={index === 0 ? firstLineOffset : lineHeight}
        >
          {line}
        </tspan>
      ))}
    </text>
  )
}
