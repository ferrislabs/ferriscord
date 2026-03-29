export interface ReplyReference {
  messageId: string
  authorId: string
  authorUsername: string
  authorAvatarUrl?: string
  preview: string
}

interface ReplyEnvelope {
  reply: ReplyReference | null
  body: string
}

const REPLY_PREFIX = '[[reply:'
const REPLY_SUFFIX = ']]'

export function getReplyPreview(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return 'Attachment'
  return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized
}

export function buildReplyContent(
  body: string,
  reply: ReplyReference | null,
): string {
  if (!reply) return body
  const encoded = encodeURIComponent(JSON.stringify(reply))
  return `${REPLY_PREFIX}${encoded}${REPLY_SUFFIX}\n${body}`
}

export function parseReplyContent(content: string): ReplyEnvelope {
  if (!content.startsWith(REPLY_PREFIX)) {
    return { reply: null, body: content }
  }

  const suffixIndex = content.indexOf(REPLY_SUFFIX)
  if (suffixIndex === -1) {
    return { reply: null, body: content }
  }

  try {
    const raw = content.slice(REPLY_PREFIX.length, suffixIndex)
    const reply = JSON.parse(decodeURIComponent(raw)) as ReplyReference
    const body = content
      .slice(suffixIndex + REPLY_SUFFIX.length)
      .replace(/^\n/, '')
    return { reply, body }
  } catch {
    return { reply: null, body: content }
  }
}
