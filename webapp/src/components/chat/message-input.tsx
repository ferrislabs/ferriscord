import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  filterMentionCandidates,
  getActiveMention,
  replaceMentionInText,
  type MentionCandidate,
} from '@/lib/mentions'
import {
  Send,
  Mic,
  Image,
  Plus,
  X,
  Loader2,
  FileText,
  Film,
} from 'lucide-react'
import { wsClient } from '@/lib/ws'
import type { ReplyReference } from '@/lib/reply'
import { buildReplyContent } from '@/lib/reply'

interface MessageInputProps {
  onSendMessage: (content: string, files?: File[]) => void
  isLoading?: boolean
  placeholder?: string
  className?: string
  disabled?: boolean
  channelName?: string
  channelType?: 'text' | 'dm'
  recipientName?: string
  mentionCandidates?: MentionCandidate[]
  typingRoom?: string
  replyTarget?: ReplyReference | null
  replyMentionEnabled?: boolean
  onToggleReplyMention?: () => void
  onCancelReply?: () => void
}

const INPUT_TEXT_PREVIEWABLE_TYPES = new Set([
  'application/json',
  'application/xml',
  'application/yaml',
  'application/x-yaml',
  'application/toml',
])
const INPUT_TEXT_PREVIEWABLE_EXTS = new Set([
  'txt',
  'md',
  'mdx',
  'rst',
  'json',
  'xml',
  'yaml',
  'yml',
  'toml',
  'csv',
  'rs',
  'py',
  'js',
  'ts',
  'jsx',
  'tsx',
  'go',
  'java',
  'c',
  'cpp',
  'h',
  'css',
  'html',
  'sh',
  'bash',
  'env',
  'ini',
  'conf',
  'log',
])

function isInputTextPreviewable(file: File): boolean {
  if (file.type.startsWith('text/')) return true
  if (INPUT_TEXT_PREVIEWABLE_TYPES.has(file.type)) return true
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return INPUT_TEXT_PREVIEWABLE_EXTS.has(ext)
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  const isText = isInputTextPreviewable(file)
  const [objectUrl] = useState(() =>
    isImage || isVideo ? URL.createObjectURL(file) : '',
  )
  const [textSnippet, setTextSnippet] = useState<string>('')

  useEffect(() => {
    if (!isText) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = (e.target?.result as string) ?? ''
      setTextSnippet(content.slice(0, 120).replace(/\r\n/g, '\n'))
    }
    reader.readAsText(file.slice(0, 500))
  }, [file, isText])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className='relative group flex-shrink-0'>
      <div className='w-24 h-24 rounded-lg overflow-hidden border border-border bg-accent/50 flex items-center justify-center'>
        {isImage ? (
          <img
            src={objectUrl}
            alt={file.name}
            className='w-full h-full object-cover'
          />
        ) : isVideo ? (
          <div className='flex flex-col items-center text-muted-foreground'>
            <Film className='w-8 h-8 mb-1' />
            <span className='text-xs truncate w-20 text-center px-1'>
              {file.name}
            </span>
          </div>
        ) : isText ? (
          <div className='w-full h-full p-1.5 overflow-hidden'>
            <pre className='text-[9px] font-mono text-muted-foreground leading-tight whitespace-pre-wrap break-all line-clamp-5'>
              {textSnippet || '…'}
            </pre>
          </div>
        ) : (
          <div className='flex flex-col items-center text-muted-foreground'>
            <FileText className='w-8 h-8 mb-1' />
            <span className='text-xs truncate w-20 text-center px-1'>
              {file.name}
            </span>
          </div>
        )}
      </div>
      <div className='absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg'>
        {formatSize(file.size)}
      </div>
      <button
        type='button'
        onClick={onRemove}
        className='absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm'
        aria-label={`Remove ${file.name}`}
      >
        <X className='w-3 h-3' />
      </button>
    </div>
  )
}

export function MessageInput({
  onSendMessage,
  isLoading = false,
  placeholder,
  className,
  disabled = false,
  channelName = 'channel',
  channelType = 'text',
  recipientName,
  mentionCandidates = [],
  typingRoom,
  replyTarget = null,
  replyMentionEnabled = true,
  onToggleReplyMention,
  onCancelReply,
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [activeMentionIndex, setActiveMentionIndex] = useState(0)
  const [caretPosition, setCaretPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingActiveRef = useRef(false)
  const lastTypingSentAtRef = useRef(0)

  const activeMention = getActiveMention(message, caretPosition)
  const mentionSuggestions = activeMention
    ? filterMentionCandidates(mentionCandidates, activeMention.query)
    : []
  const showMentionSuggestions = mentionSuggestions.length > 0

  useEffect(() => {
    setActiveMentionIndex(0)
  }, [activeMention?.query, message])

  // Generate appropriate placeholder
  let defaultPlaceholder = `Message #${channelName}`
  if (channelType === 'dm' && recipientName) {
    defaultPlaceholder = `Message @${recipientName}`
  }
  const actualPlaceholder = placeholder || defaultPlaceholder

  const handleSend = () => {
    const trimmedMessage = message.trim()
    const hasFiles = files.length > 0
    if ((trimmedMessage || hasFiles) && !isLoading && !disabled) {
      if (typingRoom && typingActiveRef.current) {
        wsClient.setTyping(typingRoom, false)
        typingActiveRef.current = false
      }
      const finalBody =
        replyTarget && replyMentionEnabled
          ? `@${replyTarget.authorUsername} ${trimmedMessage}`.trim()
          : trimmedMessage

      onSendMessage(
        buildReplyContent(finalBody, replyTarget),
        hasFiles ? files : undefined,
      )
      setMessage('')
      setFiles([])
      setIsExpanded(false)
      setCaretPosition(0)
      onCancelReply?.()
      if (textareaRef.current) {
        textareaRef.current.style.height = '20px'
      }
    }
  }

  const updateTypingState = (nextValue: string) => {
    if (!typingRoom) return

    const hasContent = nextValue.trim().length > 0
    if (!hasContent) {
      if (typingActiveRef.current) {
        wsClient.setTyping(typingRoom, false)
        typingActiveRef.current = false
      }
      return
    }

    const now = Date.now()
    if (
      !typingActiveRef.current ||
      now - lastTypingSentAtRef.current >= 2_000
    ) {
      wsClient.setTyping(typingRoom, true)
      typingActiveRef.current = true
      lastTypingSentAtRef.current = now
    }
  }

  useEffect(() => {
    if (!typingRoom || message.trim().length === 0 || disabled || isLoading) {
      return
    }

    const interval = setInterval(() => {
      wsClient.setTyping(typingRoom, true)
      typingActiveRef.current = true
      lastTypingSentAtRef.current = Date.now()
    }, 2_000)

    return () => clearInterval(interval)
  }, [typingRoom, message, disabled, isLoading])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveMentionIndex((prev) => (prev + 1) % mentionSuggestions.length)
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveMentionIndex(
          (prev) =>
            (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length,
        )
        return
      }

      if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) {
        e.preventDefault()
        const selected = mentionSuggestions[activeMentionIndex]
        if (selected) {
          insertMention(selected)
        }
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value
    setMessage(nextValue)
    setCaretPosition(e.target.selectionStart ?? nextValue.length)
    adjustTextareaHeight()
    updateTypingState(nextValue)

    if (nextValue.length > 0 && !isExpanded) {
      setIsExpanded(true)
    } else if (nextValue.length === 0 && isExpanded && files.length === 0) {
      setIsExpanded(false)
    }
  }

  useEffect(() => {
    return () => {
      if (typingRoom && typingActiveRef.current) {
        wsClient.setTyping(typingRoom, false)
      }
    }
  }, [typingRoom])

  const insertMention = (candidate: MentionCandidate) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const mention = getActiveMention(
      message,
      textarea.selectionStart ?? message.length,
    )
    if (!mention) return

    const { nextValue, nextCaretPosition } = replaceMentionInText(
      message,
      mention,
      candidate.username,
    )

    setMessage(nextValue)
    setIsExpanded(true)
    setCaretPosition(nextCaretPosition)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(nextCaretPosition, nextCaretPosition)
      adjustTextareaHeight()
    })
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.max(20, Math.min(textarea.scrollHeight, 200))
      textarea.style.height = `${newHeight}px`
    }
  }

  const focusTextarea = () => {
    if (disabled || isLoading) return
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.focus()
    const position = textarea.value.length
    textarea.setSelectionRange(position, position)
    setCaretPosition(position)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected].slice(0, 10)) // max 10 files
      setIsExpanded(true)
    }
    // Reset input so the same file can be re-selected
    e.target.value = ''
    setShowFileMenu(false)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0 && message.trim().length === 0) {
        setIsExpanded(false)
      }
      return next
    })
  }

  const canSend =
    (message.trim().length > 0 || files.length > 0) && !isLoading && !disabled

  return (
    <div
      className={cn(
        'px-4 pb-4 border-t border-sidebar-border bg-background',
        className,
      )}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        multiple
        accept='image/*,video/*,.pdf,.txt,.doc,.docx,.zip,.tar,.gz'
        className='hidden'
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {/* Main input container */}
      <div className='relative'>
        {/* File upload menu */}
        {showFileMenu && (
          <>
            <div
              className='fixed inset-0 z-10'
              onClick={() => setShowFileMenu(false)}
            />
            <div className='absolute bottom-full left-0 mb-2 bg-popover text-popover-foreground rounded-lg p-2 shadow-xl z-20 min-w-[180px] border border-border'>
              <div className='space-y-1'>
                <button
                  className='w-full flex items-center space-x-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded text-sm transition-colors'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center'>
                    <Image className='w-4 h-4 text-white' />
                  </div>
                  <span>Upload a File</span>
                </button>
                <button className='w-full flex items-center space-x-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded text-sm transition-colors'>
                  <div className='w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center'>
                    <Mic className='w-4 h-4 text-white' />
                  </div>
                  <span>Record Voice</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Input wrapper */}
        <div
          className={cn(
            'bg-accent/50 rounded-lg border transition-all duration-200',
            isExpanded
              ? 'bg-background border-border shadow-sm'
              : 'border-transparent',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          {replyTarget && (
            <div className='flex items-start justify-between gap-3 border-b border-border/70 px-3 py-2'>
              <div className='min-w-0'>
                <p className='text-xs font-semibold text-foreground'>
                  Replying to @{replyTarget.authorUsername}
                </p>
                <p className='truncate text-xs text-muted-foreground'>
                  {replyTarget.preview}
                </p>
                <p className='mt-1 text-[11px] text-muted-foreground'>
                  {replyMentionEnabled
                    ? 'Will mention user'
                    : "Won't mention user"}
                </p>
              </div>
              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  onClick={onToggleReplyMention}
                  className={cn(
                    'rounded px-2 py-1 text-[11px] font-medium transition-colors',
                    replyMentionEnabled
                      ? 'bg-primary/15 text-primary hover:bg-primary/25'
                      : 'bg-accent text-muted-foreground hover:text-foreground',
                  )}
                >
                  {replyMentionEnabled ? 'Mention: on' : 'Mention: off'}
                </button>
                <button
                  type='button'
                  onClick={onCancelReply}
                  className='rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                  aria-label='Cancel reply'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            </div>
          )}

          {/* File previews */}
          {files.length > 0 && (
            <div className='flex gap-2 p-3 pb-0 flex-wrap'>
              {files.map((file, index) => (
                <FilePreview
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          )}

          <div className='flex items-end'>
            {/* Plus button */}
            <div className='p-3'>
              <button
                type='button'
                onClick={() => setShowFileMenu(!showFileMenu)}
                disabled={disabled}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
                  showFileMenu
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  disabled && 'cursor-not-allowed',
                )}
                aria-label={showFileMenu ? 'Close file menu' : 'Open file menu'}
              >
                {showFileMenu ? (
                  <X className='w-4 h-4' />
                ) : (
                  <Plus className='w-4 h-4' />
                )}
              </button>
            </div>

            {/* Text input */}
            <div
              className='flex flex-1 cursor-text items-center py-3 pr-2'
              onClick={focusTextarea}
            >
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onClick={(e) => {
                  setActiveMentionIndex(0)
                  setCaretPosition(
                    e.currentTarget.selectionStart ?? message.length,
                  )
                }}
                onKeyUp={(e) => {
                  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') {
                    setActiveMentionIndex(0)
                  }
                  setCaretPosition(
                    e.currentTarget.selectionStart ?? message.length,
                  )
                }}
                placeholder={actualPlaceholder}
                disabled={disabled || isLoading}
                aria-label='Message input'
                className={cn(
                  'w-full bg-transparent border-0 outline-none resize-none text-foreground placeholder:text-muted-foreground',
                  'text-sm leading-5 min-h-[20px] max-h-[200px]',
                )}
                style={{ height: '20px' }}
                rows={1}
              />
            </div>

            {/* Action buttons */}
            <div className='flex items-center pr-3 pb-3'>
              {(canSend || isLoading) && (
                <Button
                  type='button'
                  size='icon'
                  onClick={handleSend}
                  disabled={!canSend}
                  className={cn(
                    'h-8 w-8',
                    canSend
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      : '',
                  )}
                  aria-label='Send message'
                >
                  {isLoading ? (
                    <Loader2 className='w-5 h-5 animate-spin' />
                  ) : (
                    <Send className='w-5 h-5' />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {showMentionSuggestions && (
          <div className='absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-lg border border-border bg-popover shadow-xl'>
            <div className='border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              Mention a member
            </div>
            <div className='py-1'>
              {mentionSuggestions.map((candidate, index) => {
                const displayName = candidate.displayName ?? candidate.username
                const isActive = index === activeMentionIndex

                return (
                  <button
                    key={candidate.id}
                    type='button'
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/60',
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertMention(candidate)
                    }}
                  >
                    <Avatar className='h-8 w-8'>
                      <AvatarImage
                        src={candidate.avatarUrl ?? undefined}
                        alt={displayName}
                      />
                      <AvatarFallback className='text-xs'>
                        {displayName[0]?.toUpperCase() ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-medium'>
                        {displayName}
                      </div>
                      <div className='truncate text-xs text-muted-foreground'>
                        @{candidate.username}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Character counter */}
        {message.length > 1800 && (
          <div className='absolute -top-6 right-2 text-xs text-muted-foreground'>
            <span
              className={cn(
                message.length > 2000
                  ? 'text-destructive font-semibold'
                  : 'text-muted-foreground',
              )}
            >
              {2000 - message.length}
            </span>
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className='mt-2 text-xs text-muted-foreground'>
        Press <kbd className='px-1 py-0.5 bg-accent rounded text-xs'>Enter</kbd>{' '}
        to send,{' '}
        <kbd className='px-1 py-0.5 bg-accent rounded text-xs'>Shift+Enter</kbd>{' '}
        for new line
      </div>
    </div>
  )
}
