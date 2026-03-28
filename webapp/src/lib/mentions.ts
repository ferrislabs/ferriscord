export interface MentionCandidate {
  id: string
  username: string
  displayName?: string | null
  avatarUrl?: string | null
}

export interface ActiveMention {
  query: string
  start: number
  end: number
}

const MENTION_QUERY_RE = /(?:^|\s)@([a-zA-Z0-9._-]*)$/

export function getActiveMention(
  value: string,
  caretPosition: number,
): ActiveMention | null {
  const beforeCaret = value.slice(0, caretPosition)
  const match = beforeCaret.match(MENTION_QUERY_RE)

  if (!match || match.index == null) return null

  const token = match[0]
  const atOffset = token.lastIndexOf('@')

  if (atOffset < 0) return null

  return {
    query: match[1] ?? '',
    start: match.index + atOffset,
    end: caretPosition,
  }
}

export function filterMentionCandidates(
  candidates: MentionCandidate[],
  query: string,
): MentionCandidate[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) return candidates.slice(0, 8)

  return candidates
    .filter((candidate) => {
      const username = candidate.username.toLowerCase()
      const displayName = candidate.displayName?.toLowerCase() ?? ''
      return (
        username.includes(normalizedQuery) ||
        displayName.includes(normalizedQuery)
      )
    })
    .slice(0, 8)
}

export function replaceMentionInText(
  value: string,
  mention: ActiveMention,
  username: string,
): { nextValue: string; nextCaretPosition: number } {
  const insertion = `@${username} `
  const nextValue =
    value.slice(0, mention.start) + insertion + value.slice(mention.end)
  const nextCaretPosition = mention.start + insertion.length

  return { nextValue, nextCaretPosition }
}

export function containsMention(
  content: string,
  username?: string | null,
): boolean {
  if (!username) return false

  const escapedUsername = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const mentionRegex = new RegExp(
    `(^|\\s)@${escapedUsername}(?=$|[^\\w.-])`,
    'i',
  )

  return mentionRegex.test(content)
}
