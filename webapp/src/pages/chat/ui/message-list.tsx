import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { MoreHorizontal, Reply, Smile, Copy, Download, FileText, ChevronDown, ChevronUp, X, ZoomIn } from "lucide-react";
import { FormattedMessage } from "@/components/ui/formatted-message";
import { MessageReactions } from "@/components/ui/message-reactions";
import type { Schemas } from "@/api/api.client";
import { UserProfileCard, type UserCardInfo } from "@/components/chat/user-profile-card";

// ─── Text attachment preview ──────────────────────────────────────────────────

const TEXT_PREVIEWABLE_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/yaml",
  "application/x-yaml",
  "application/toml",
]);

const TEXT_PREVIEWABLE_EXTS = new Set([
  "txt", "md", "mdx", "rst", "json", "xml", "yaml", "yml", "toml", "csv",
  "rs", "py", "js", "ts", "jsx", "tsx", "go", "java", "c", "cpp", "h",
  "css", "html", "sh", "bash", "zsh", "fish", "env", "ini", "conf", "log",
]);

function isTextPreviewable(contentType: string, filename: string): boolean {
  if (contentType.startsWith("text/")) return true;
  if (TEXT_PREVIEWABLE_TYPES.has(contentType)) return true;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_PREVIEWABLE_EXTS.has(ext);
}

const PREVIEW_CHARS = 600;

function TextAttachmentPreview({ att }: { att: Schemas.Attachment }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(att.url)
      .then((r) => r.text())
      .then((t) => { if (!cancelled) { setText(t); setLoading(false); } })
      .catch(() => { if (!cancelled) { setText(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [att.url]);

  const preview = text === null ? null : expanded ? text : text.slice(0, PREVIEW_CHARS);
  const isTruncated = text !== null && text.length > PREVIEW_CHARS;

  return (
    <div className="max-w-sm w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 flex-shrink-0 text-gray-500" />
          <span className="font-medium text-gray-700 truncate">{att.filename}</span>
        </div>
        <a
          href={att.url}
          download={att.filename}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>

      {/* Body */}
      <div className="bg-gray-50 px-3 py-2">
        {loading && (
          <span className="text-xs text-gray-400">Loading preview…</span>
        )}
        {!loading && text === null && (
          <span className="text-xs text-gray-400">Preview unavailable</span>
        )}
        {preview !== null && (
          <>
            <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto leading-relaxed">
              {preview}
            </pre>
            {isTruncated && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1.5 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
              >
                {expanded ? (
                  <><ChevronUp className="w-3 h-3" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Show more ({text.length - PREVIEW_CHARS} more chars)</>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Image lightbox ───────────────────────────────────────────────────────────

function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  // Trigger enter animation on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-all duration-200",
        visible ? "bg-black/85 backdrop-blur-sm" : "bg-black/0 backdrop-blur-none",
      )}
      onClick={onClose}
    >
      {/* Image container */}
      <div
        className={cn(
          "relative transition-all duration-200",
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain"
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Filename */}
        {alt && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-xs rounded-full max-w-xs truncate">
            {alt}
          </div>
        )}
      </div>
    </div>
  );
}

interface Message {
  id: string;
  content: string;
  attachments?: Schemas.Attachment[];
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  timestamp: string;
  isOwn?: boolean;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
    hasReacted: boolean;
  }>;
}

interface MessageListProps {
  messages: Message[];
  className?: string;
}

function shouldGroupMessages(currentMessage: Message, previousMessage: Message | null): boolean {
  if (!previousMessage) return false;

  // Don't group if different authors
  if (currentMessage.author.id !== previousMessage.author.id) return false;

  // Don't group if more than 7 minutes apart
  const currentTime = new Date(currentMessage.timestamp).getTime();
  const previousTime = new Date(previousMessage.timestamp).getTime();
  const timeDiff = currentTime - previousTime;

  return timeDiff <= 7 * 60 * 1000; // 7 minutes in milliseconds
}

function MessageItem({
  message,
  isGrouped,
  showTimestamp
}: {
  message: Message;
  isGrouped: boolean;
  showTimestamp: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<{ src: string; alt: string } | null>(null);
  const [profileCard, setProfileCard] = useState<{ user: UserCardInfo; anchorRect: DOMRect } | null>(null);

  const openProfile = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setProfileCard({
      user: {
        id: message.author.id,
        username: message.author.username,
        avatarUrl: message.author.avatar ?? null,
      },
      anchorRect: rect,
    });
  }, [message.author]);

  const initials = message.author.username
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <div
      className={cn(
        "group relative px-4 py-0.5 hover:bg-gray-50/80 transition-colors duration-75",
        isGrouped ? "mt-0.5" : "mt-4"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Message Actions */}
      {isHovered && (
        <div className="absolute right-6 -top-2 bg-white border border-gray-200 rounded-md shadow-md flex items-center z-10">
          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-l-md transition-colors">
            <Smile className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Reply className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Copy className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-r-md transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex">
        {/* Avatar column */}
        <div className="w-10 flex-shrink-0 mr-4">
          {!isGrouped && (
            <button type="button" onClick={openProfile} className="rounded-full focus:outline-none">
              <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={message.author.avatar} alt={message.author.username} />
                <AvatarFallback className="text-xs font-medium bg-indigo-500 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          )}
          {isGrouped && showTimestamp && (
            <div className="text-xs text-gray-400 text-right opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
              {formatTime(message.timestamp)}
            </div>
          )}
        </div>

        {/* Message content */}
        <div className="flex-1 min-w-0">
          {!isGrouped && (
            <div className="flex items-baseline mb-1">
              <button
                type="button"
                onClick={openProfile}
                className="font-semibold text-gray-900 text-sm hover:underline cursor-pointer focus:outline-none"
              >
                {message.author.username}
              </button>
              <span className="text-xs text-gray-500 ml-2">
                {formatDate(message.timestamp)} at {formatTime(message.timestamp)}
              </span>
            </div>
          )}


          <FormattedMessage
            content={message.content}
            className="text-gray-800 text-[15px] leading-5"
          />

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.attachments.map((att) => {
                const isImage = att.content_type.startsWith("image/");
                const isVideo = att.content_type.startsWith("video/");
                const isText = isTextPreviewable(att.content_type, att.filename);

                if (isImage) {
                  return (
                    <button
                      key={att.id}
                      type="button"
                      className="group relative block rounded-lg overflow-hidden border border-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      onClick={() => setLightboxSrc({ src: att.url, alt: att.filename })}
                    >
                      <img
                        src={att.url}
                        alt={att.filename}
                        className="max-w-xs max-h-72 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity duration-200" />
                      </div>
                    </button>
                  );
                }

                if (isVideo) {
                  return (
                    <video
                      key={att.id}
                      src={att.url}
                      controls
                      className="max-w-xs max-h-72 rounded-lg border border-gray-200"
                    />
                  );
                }

                if (isText) {
                  return <TextAttachmentPreview key={att.id} att={att} />;
                }

                return (
                  <a
                    key={att.id}
                    href={att.url}
                    download={att.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 text-sm text-gray-700 transition-colors max-w-xs"
                  >
                    <FileText className="w-4 h-4 flex-shrink-0 text-gray-500" />
                    <span className="truncate flex-1">{att.filename}</span>
                    <Download className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Message reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <MessageReactions
              reactions={message.reactions}
              onAddReaction={(emoji) => {
                // Handle add reaction - this would call an API
                console.log('Add reaction:', emoji, 'to message:', message.id);
              }}
              onRemoveReaction={(emoji) => {
                // Handle remove reaction - this would call an API
                console.log('Remove reaction:', emoji, 'from message:', message.id);
              }}
              className="mt-1"
            />
          )}
        </div>
      </div>

      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc.src}
          alt={lightboxSrc.alt}
          onClose={() => setLightboxSrc(null)}
        />
      )}

      {profileCard && (
        <UserProfileCard
          user={profileCard.user}
          anchorRect={profileCard.anchorRect}
          onClose={() => setProfileCard(null)}
        />
      )}
    </div>
  );
}

function MessageDateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center my-6 px-4">
      <div className="flex-1 h-px bg-gray-300"></div>
      <div className="px-4 text-xs font-semibold text-gray-600 bg-gray-50 rounded-lg py-1">
        {date}
      </div>
      <div className="flex-1 h-px bg-gray-300"></div>
    </div>
  );
}

export function MessageList({ messages, className }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
          <p className="text-sm">Start the conversation by sending a message!</p>
        </div>
      </div>
    );
  }

  let lastMessageDate: string | null = null;

  return (
    <ScrollArea className={cn("flex-1", className)}>
      <div className="pb-4">
        {/* Welcome message */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
              #
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome to the channel!
              </h2>
              <p className="text-gray-600">
                This is the beginning of your conversation.
              </p>
            </div>
          </div>
        </div>

        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : null;
          const isGrouped = shouldGroupMessages(message, previousMessage);

          const messageDate = new Date(message.timestamp).toDateString();
          const shouldShowDateSeparator = lastMessageDate !== messageDate;

          if (shouldShowDateSeparator) {
            lastMessageDate = messageDate;
          }

          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
          const showTimestamp = !nextMessage || !shouldGroupMessages(nextMessage, message);

          return (
            <div key={message.id}>
              {shouldShowDateSeparator && (
                <MessageDateSeparator
                  date={new Date(message.timestamp).toLocaleDateString([], {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                />
              )}
              <MessageItem
                message={message}
                isGrouped={isGrouped}
                showTimestamp={showTimestamp}
              />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
