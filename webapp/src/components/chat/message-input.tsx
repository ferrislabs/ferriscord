import { useState, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Send,
  Smile,
  Gift,
  Sticker,
  Mic,
  Image,
  Plus,
  X,
  Loader2
} from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  channelName?: string;
  channelType?: 'text' | 'dm';
  recipientName?: string;
}

export function MessageInput({
  onSendMessage,
  isLoading = false,
  placeholder,
  className,
  disabled = false,
  channelName = "channel",
  channelType = 'text',
  recipientName,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate appropriate placeholder
  let defaultPlaceholder = `Message #${channelName}`;
  if (channelType === 'dm' && recipientName) {
    defaultPlaceholder = `Message @${recipientName}`;
  }
  const actualPlaceholder = placeholder || defaultPlaceholder;

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
      setIsExpanded(false);
      // Reset textarea height to initial state
      if (textareaRef.current) {
        textareaRef.current.style.height = "20px";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();

    // Expand input area if user is typing
    if (e.target.value.length > 0 && !isExpanded) {
      setIsExpanded(true);
    } else if (e.target.value.length === 0 && isExpanded) {
      setIsExpanded(false);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Calculate new height (minimum 20px, maximum 200px)
      const newHeight = Math.max(20, Math.min(textarea.scrollHeight, 200));
      textarea.style.height = `${newHeight}px`;
    }
  };

  const canSend = message.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className={cn("px-4 pb-4 border-t border-sidebar-border bg-background", className)}>
      {/* Typing indicator */}
      <div className="mb-2 h-5 flex items-center">
        <div className="text-sm text-muted-foreground">
          {/* This would show typing users in a real implementation */}
        </div>
      </div>

      {/* Main input container */}
      <div className="relative">
        {/* File upload menu */}
        {showFileMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowFileMenu(false)}
            />

            {/* Menu */}
            <div className="absolute bottom-full left-0 mb-2 bg-popover text-popover-foreground rounded-lg p-2 shadow-xl z-20 min-w-[180px] border border-border">
              <div className="space-y-1">
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded text-sm transition-colors">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Image className="w-4 h-4 text-white" />
                  </div>
                  <span>Upload a File</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded text-sm transition-colors">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Mic className="w-4 h-4 text-white" />
                  </div>
                  <span>Record Voice</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Input wrapper */}
        <div className={cn(
          "bg-accent/50 rounded-lg border transition-all duration-200",
          isExpanded ? "bg-background border-border shadow-sm" : "border-transparent",
          disabled && "opacity-50 cursor-not-allowed"
        )}>
          <div className="flex items-end">
            {/* Plus button */}
            <div className="p-3">
              <button
                type="button"
                onClick={() => setShowFileMenu(!showFileMenu)}
                disabled={disabled}
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                  showFileMenu
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  disabled && "cursor-not-allowed"
                )}
                aria-label={showFileMenu ? "Close file menu" : "Open file menu"}
              >
                {showFileMenu ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>

            {/* Text input */}
            <div className="flex-1 py-3 pr-2">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={actualPlaceholder}
                disabled={disabled || isLoading}
                aria-label="Message input"
                className={cn(
                  "w-full bg-transparent border-0 outline-none resize-none text-foreground placeholder:text-muted-foreground",
                  "text-sm leading-5 min-h-[20px] max-h-[200px]"
                )}
                style={{ height: "20px" }}
                rows={1}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center pr-3 pb-3 space-x-1">
              {/* Gift button */}
              <button
                type="button"
                disabled={disabled}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors disabled:cursor-not-allowed"
                aria-label="Send gift"
              >
                <Gift className="w-5 h-5" />
              </button>

              {/* Sticker button */}
              <button
                type="button"
                disabled={disabled}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors disabled:cursor-not-allowed"
                aria-label="Send sticker"
              >
                <Sticker className="w-5 h-5" />
              </button>

              {/* Emoji button */}
              <button
                type="button"
                disabled={disabled}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors disabled:cursor-not-allowed"
                aria-label="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Send button - only show when there's text or when loading */}
              {(canSend || isLoading) && (
                <Button
                  type="button"
                  size="icon"
                  onClick={handleSend}
                  disabled={!canSend}
                  className={cn(
                    "h-8 w-8",
                    canSend
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : ""
                  )}
                  aria-label="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Character counter */}
        {message.length > 1800 && (
          <div className="absolute -top-6 right-2 text-xs text-muted-foreground">
            <span className={cn(
              message.length > 2000 ? "text-destructive font-semibold" : "text-muted-foreground"
            )}>
              {2000 - message.length}
            </span>
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="mt-2 text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-accent rounded text-xs">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-accent rounded text-xs">Shift+Enter</kbd> for new line
      </div>
    </div>
  );
}
