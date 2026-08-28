export function wrapSvgLabel(label: string, maxCharacters: number): string[] {
  const words = label.trim().split(/\s+/)
  if (words.length === 0 || !words[0]) return []

  const lines: string[] = []
  let currentLine = words[0]

  for (const word of words.slice(1)) {
    const candidate = `${currentLine} ${word}`
    if (candidate.length <= maxCharacters) {
      currentLine = candidate
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }

  lines.push(currentLine)
  return lines
}
