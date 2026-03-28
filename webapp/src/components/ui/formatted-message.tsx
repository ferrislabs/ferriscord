import { cn } from '@/lib/utils'
import { useProfileCardStore } from '@/stores/profile-card.store'
import type { MentionCandidate } from '@/lib/mentions'

interface FormattedMessageProps {
  content: string
  className?: string
  mentionCandidates?: MentionCandidate[]
  guildId?: string
  currentUsername?: string
}

interface MessageSegment {
  type:
    | 'text'
    | 'bold'
    | 'italic'
    | 'code'
    | 'codeblock'
    | 'mention'
    | 'channel'
    | 'link'
  content: string
  language?: string
}

function parseMessage(content: string): MessageSegment[] {
  const segments: MessageSegment[] = []

  // Patterns for different markdown elements
  const patterns = [
    { regex: /\*\*(.*?)\*\*/g, type: 'bold' as const },
    { regex: /\*(.*?)\*/g, type: 'italic' as const },
    { regex: /`([^`\n]+)`/g, type: 'code' as const },
    { regex: /```(\w+)?\n?([\s\S]*?)```/g, type: 'codeblock' as const },
    { regex: /@([\w.-]+)/g, type: 'mention' as const },
    { regex: /#([\w-]+)/g, type: 'channel' as const },
    { regex: /(https?:\/\/[^\s]+)/g, type: 'link' as const },
  ]

  let matches: Array<{
    index: number
    length: number
    type: string
    content: string
    language?: string
  }> = []

  // Find all matches
  patterns.forEach((pattern) => {
    let match
    while ((match = pattern.regex.exec(content)) !== null) {
      if (pattern.type === 'codeblock') {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: pattern.type,
          content: match[2] || match[1],
          language: match[1],
        })
      } else {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: pattern.type,
          content: match[1] || match[0],
        })
      }
    }
  })

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index)

  // Remove overlapping matches (keep the first one)
  const filteredMatches: typeof matches = []
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]
    const isOverlapping = filteredMatches.some(
      (existing) =>
        current.index < existing.index + existing.length &&
        current.index + current.length > existing.index,
    )

    if (!isOverlapping) {
      filteredMatches.push(current)
    }
  }

  // Build segments
  let lastIndex = 0

  filteredMatches.forEach((match) => {
    // Add text before the match
    if (match.index > lastIndex) {
      const textContent = content.slice(lastIndex, match.index)
      if (textContent) {
        segments.push({ type: 'text', content: textContent })
      }
    }

    // Add the formatted segment
    segments.push({
      type: match.type as MessageSegment['type'],
      content: match.content,
      language: match.language,
    })

    lastIndex = match.index + match.length
  })

  // Add remaining text
  if (lastIndex < content.length) {
    const remainingContent = content.slice(lastIndex)
    if (remainingContent) {
      segments.push({ type: 'text', content: remainingContent })
    }
  }

  // If no matches found, return the whole content as text
  if (segments.length === 0) {
    segments.push({ type: 'text', content })
  }

  return segments
}

function renderSegment(
  segment: MessageSegment,
  index: number,
  mentionCandidates: MentionCandidate[],
  guildId: string | undefined,
  currentUsername: string | undefined,
  onMentionClick: ReturnType<typeof useProfileCardStore.getState>['toggle'],
): React.ReactElement {
  const key = `segment-${index}`

  switch (segment.type) {
    case 'bold':
      return (
        <strong key={key} className='font-semibold'>
          {segment.content}
        </strong>
      )

    case 'italic':
      return (
        <em key={key} className='italic'>
          {segment.content}
        </em>
      )

    case 'code':
      return (
        <code
          key={key}
          className='rounded bg-muted px-1 py-0.5 text-sm font-mono text-foreground'
        >
          {segment.content}
        </code>
      )

    case 'codeblock':
      return (
        <div key={key} className='my-2'>
          <pre className='overflow-x-auto rounded-md border border-border bg-muted/80 p-3 text-sm text-foreground'>
            {segment.language && (
              <div className='mb-2 text-xs font-medium text-muted-foreground'>
                {segment.language}
              </div>
            )}
            <code className='font-mono whitespace-pre'>{segment.content}</code>
          </pre>
        </div>
      )

    case 'mention':
      const matchedUser = mentionCandidates.find(
        (candidate) =>
          candidate.username.toLowerCase() === segment.content.toLowerCase(),
      )
      const label = matchedUser?.displayName ?? segment.content
      const isCurrentUser =
        !!currentUsername &&
        segment.content.toLowerCase() === currentUsername.toLowerCase()

      if (!matchedUser) {
        return (
          <span
            key={key}
            className={cn(
              'inline rounded px-1 py-0.5 text-sm font-medium',
              isCurrentUser
                ? 'bg-amber-200/80 text-amber-950 dark:bg-amber-500/25 dark:text-amber-100'
                : 'bg-primary/15 text-primary',
            )}
          >
            @{label}
          </span>
        )
      }

      return (
        <button
          key={key}
          type='button'
          className={cn(
            'inline rounded px-1 py-0.5 text-sm font-medium transition-colors',
            isCurrentUser
              ? 'bg-amber-200/80 text-amber-950 hover:bg-amber-300/80 dark:bg-amber-500/25 dark:text-amber-100 dark:hover:bg-amber-500/35'
              : 'bg-primary/15 text-primary hover:bg-primary/25',
          )}
          onClick={(e) => {
            onMentionClick(
              {
                id: matchedUser.id,
                username: matchedUser.username,
                displayName: matchedUser.displayName,
                avatarUrl: matchedUser.avatarUrl,
                guildId: guildId ?? null,
              },
              e,
            )
          }}
        >
          @{label}
        </button>
      )

    case 'channel':
      return (
        <span
          key={key}
          className='cursor-pointer rounded bg-accent px-1 py-0.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/80'
        >
          #{segment.content}
        </span>
      )

    case 'link':
      return (
        <a
          key={key}
          href={segment.content}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary underline transition-colors hover:text-primary/80 hover:no-underline'
        >
          {segment.content}
        </a>
      )

    case 'text':
    default:
      return (
        <span key={key}>
          {segment.content.split('\n').map((line, lineIndex, lines) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          ))}
        </span>
      )
  }
}

export function FormattedMessage({
  content,
  className,
  mentionCandidates = [],
  guildId,
  currentUsername,
}: FormattedMessageProps) {
  const segments = parseMessage(content)
  const toggleProfile = useProfileCardStore((s) => s.toggle)

  return (
    <div className={cn('break-words whitespace-pre-wrap', className)}>
      {segments.map((segment, index) =>
        renderSegment(
          segment,
          index,
          mentionCandidates,
          guildId,
          currentUsername,
          toggleProfile,
        ),
      )}
    </div>
  )
}
