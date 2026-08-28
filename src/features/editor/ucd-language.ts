import {
  HighlightStyle,
  StreamLanguage,
  syntaxHighlighting,
} from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

const ucdStreamLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null
    if (stream.sol() && stream.match(/^#\s+.*/)) return 'heading'
    if (stream.match(/^\/\/.*/)) return 'comment'
    if (stream.match(/^(actors|use cases|layout)(?=:)/)) return 'keyword'
    if (stream.match(/^system(?=\s)/)) return 'keyword'
    if (stream.match(/^direction(?=:)/)) return 'propertyName'
    if (stream.match(/^"(?:\\.|[^"\\])*"/)) return 'string'
    if (stream.match(/^(--\|>|\.\.>|->)/)) return 'operator'
    if (
      stream.match(
        /^(include|extend|left-to-right|right-to-left|top-to-bottom|bottom-to-top)\b/i,
      )
    )
      return 'atom'
    if (stream.match(/^-?\d+(?:\.\d+)?/)) return 'number'
    if (stream.match(/^[-:#,]/)) return 'punctuation'

    stream.next()
    return null
  },
})

const ucdHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, color: 'var(--syntax-heading)', fontWeight: '650' },
  { tag: tags.keyword, color: 'var(--syntax-keyword)', fontWeight: '600' },
  { tag: tags.propertyName, color: 'var(--syntax-property)' },
  { tag: tags.string, color: 'var(--syntax-string)' },
  { tag: tags.operator, color: 'var(--syntax-operator)', fontWeight: '600' },
  { tag: tags.atom, color: 'var(--syntax-atom)' },
  { tag: tags.number, color: 'var(--syntax-number)' },
  { tag: tags.comment, color: 'var(--syntax-comment)', fontStyle: 'italic' },
  { tag: tags.punctuation, color: 'var(--syntax-punctuation)' },
])

const ucdEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    color: 'var(--editor-foreground)',
    backgroundColor: 'var(--editor-surface)',
    fontSize: '13px',
  },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: "ui-monospace, 'SFMono-Regular', Consolas, monospace",
    lineHeight: '1.65',
    scrollbarColor: 'var(--border) transparent',
  },
  '.cm-content': { padding: '16px 0', caretColor: 'var(--primary)' },
  '.cm-line': { padding: '0 18px 0 10px' },
  '.cm-gutters': {
    color: 'var(--editor-gutter-foreground)',
    backgroundColor: 'var(--editor-gutter)',
    borderRight: '1px solid var(--border)',
  },
  '.cm-gutterElement': { padding: '0 10px 0 12px' },
  '.cm-activeLine': { backgroundColor: 'var(--editor-active-line)' },
  '.cm-activeLineGutter': {
    color: 'var(--editor-foreground)',
    backgroundColor: 'var(--editor-active-line)',
  },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--editor-selection) !important',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--primary)' },
})

export const ucdEditorExtensions = [
  ucdStreamLanguage,
  syntaxHighlighting(ucdHighlightStyle),
  ucdEditorTheme,
  EditorView.lineWrapping,
]
