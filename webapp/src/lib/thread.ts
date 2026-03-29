export interface ThreadReference {
  threadId: string
  threadName: string
  sourceMessageId?: string
  sourceAuthorUsername?: string
  sourcePreview?: string
}

interface ThreadNoticeEnvelope {
  thread: ThreadReference | null
  body: string
}

const THREAD_PREFIX = '[[thread:'
const THREAD_SUFFIX = ']]'

export function buildThreadNoticeContent(thread: ThreadReference): string {
  const encoded = encodeURIComponent(JSON.stringify(thread))
  return `${THREAD_PREFIX}${encoded}${THREAD_SUFFIX}`
}

export function parseThreadNoticeContent(
  content: string,
): ThreadNoticeEnvelope {
  if (!content.startsWith(THREAD_PREFIX)) {
    return { thread: null, body: content }
  }

  const suffixIndex = content.indexOf(THREAD_SUFFIX)
  if (suffixIndex === -1) {
    return { thread: null, body: content }
  }

  try {
    const raw = content.slice(THREAD_PREFIX.length, suffixIndex)
    const thread = JSON.parse(decodeURIComponent(raw)) as ThreadReference
    const body = content
      .slice(suffixIndex + THREAD_SUFFIX.length)
      .replace(/^\n/, '')
    return { thread, body }
  } catch {
    return { thread: null, body: content }
  }
}
