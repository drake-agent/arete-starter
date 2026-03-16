import TurndownService from 'turndown'
import { marked } from 'marked'

// ─── Markdown → HTML ───
export function markdownToHtml(md: string): string {
  if (!md || !md.trim()) return ''
  return marked.parse(md, { async: false }) as string
}

// ─── HTML → Markdown ───
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

// Task list support
turndown.addRule('taskListItem', {
  filter: (node) => {
    return (
      node.nodeName === 'LI' &&
      node.getAttribute('data-type') === 'taskItem'
    )
  },
  replacement: (content, node) => {
    const checked = (node as HTMLElement).getAttribute('data-checked') === 'true'
    const cleaned = content.replace(/^\n+/, '').replace(/\n+$/, '')
    return `- [${checked ? 'x' : ' '}] ${cleaned}\n`
  },
})

export function htmlToMarkdown(html: string): string {
  if (!html || !html.trim()) return ''
  return turndown.turndown(html).trim()
}
