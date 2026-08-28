import type { ParserError, SourcePosition, SourceRange } from './types'

export type LineTokenKind = 'content' | 'blank' | 'comment' | 'invalid'

export type LineToken = {
  kind: LineTokenKind
  line: number
  raw: string
  text: string
  indent: number
  contentColumn: number
  range: SourceRange
}

export type LexUCDResult = {
  tokens: LineToken[]
  errors: ParserError[]
  end: SourcePosition
}

export function lexUCD(source: string): LexUCDResult {
  const errors: ParserError[] = []
  const tokens: LineToken[] = []
  const lines = source.split('\n')
  let offset = 0

  lines.forEach((lineWithPossibleCarriageReturn, index) => {
    const raw = lineWithPossibleCarriageReturn.endsWith('\r')
      ? lineWithPossibleCarriageReturn.slice(0, -1)
      : lineWithPossibleCarriageReturn
    const line = index + 1
    const leadingWhitespace = raw.match(/^[\t ]*/)?.[0] ?? ''
    const firstTab = leadingWhitespace.indexOf('\t')
    const indent = leadingWhitespace.replaceAll('\t', '  ').length
    const text = raw.slice(leadingWhitespace.length).trimEnd()
    const contentColumn = leadingWhitespace.length + 1
    const range = createLineRange(line, raw, contentColumn, offset)

    if (firstTab >= 0) {
      errors.push({
        code: 'unexpected-indentation',
        message: 'Tabs are not allowed for indentation.',
        line,
        column: firstTab + 1,
        endColumn: firstTab + 2,
        hint: 'Use two spaces for nested lines.',
      })
    }

    const kind = getLineKind(text, firstTab >= 0)
    if (kind === 'content' && hasUnterminatedQuote(text)) {
      const quoteColumn = text.lastIndexOf('"') + contentColumn
      errors.push({
        code: 'unterminated-quote',
        message: 'This quoted name is not closed.',
        line,
        column: quoteColumn,
        endColumn: raw.length + 1,
        hint: 'Add a closing double quote.',
      })
      tokens.push({
        kind: 'invalid',
        line,
        raw,
        text,
        indent,
        contentColumn,
        range,
      })
    } else {
      tokens.push({ kind, line, raw, text, indent, contentColumn, range })
    }

    offset +=
      lineWithPossibleCarriageReturn.length + (index < lines.length - 1 ? 1 : 0)
  })

  const lastLine = lines.at(-1) ?? ''
  const finalLineLength = lastLine.endsWith('\r')
    ? lastLine.length - 1
    : lastLine.length

  return {
    tokens,
    errors,
    end: {
      line: lines.length,
      column: finalLineLength + 1,
      offset: source.length,
    },
  }
}

function getLineKind(text: string, isInvalid: boolean): LineTokenKind {
  if (isInvalid) return 'invalid'
  if (text.length === 0) return 'blank'
  if (text.startsWith('//')) return 'comment'
  return 'content'
}

function hasUnterminatedQuote(text: string): boolean {
  let isQuoted = false
  let isEscaped = false

  for (const character of text) {
    if (isEscaped) {
      isEscaped = false
      continue
    }

    if (character === '\\') {
      isEscaped = true
      continue
    }

    if (character === '"') isQuoted = !isQuoted
  }

  return isQuoted
}

function createLineRange(
  line: number,
  raw: string,
  contentColumn: number,
  offset: number,
): SourceRange {
  return {
    start: {
      line,
      column: contentColumn,
      offset: offset + contentColumn - 1,
    },
    end: {
      line,
      column: raw.length + 1,
      offset: offset + raw.length,
    },
  }
}
