import CodeMirror from '@uiw/react-codemirror'

import { ucdEditorExtensions } from '@/features/editor/ucd-language'

export type SourceEditorProps = {
  value: string
  onChange: (value: string) => void
}

export function SourceEditor({ value, onChange }: SourceEditorProps) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      aria-label="UCD source"
      extensions={ucdEditorExtensions}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        highlightSelectionMatches: false,
        foldGutter: false,
        autocompletion: false,
        bracketMatching: false,
      }}
    />
  )
}
