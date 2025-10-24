import { useState, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import {
  Send,
  Smile,
  Gift,
  Sticker,
  Mic,
  Image,
  Plus,
  X
} from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  channelName?: string;
}

export function MessageInput({
  onSendMessage,
  isLoading = false,
  placeholder,
  className,
  disabled = false,
  channelName = "channel",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const defaultPlaceholder = `Message #${channelName}`;
  const actualPlaceholder = placeholder || defaultPlaceholder;

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
      setIsExpanded(false);
      adjustTextareaHeight();
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
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 200); // Max height of ~8 lines
      textarea.style.height = `${newHeight}px`;
    }
  };

  const canSend = message.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className={cn("px-4 pb-6 bg-gray-50", className)}>
      {/* Typing indicator */}
      <div className="mb-2 h-5 flex items-center">
        <div className="text-sm text-gray-500">
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
            <div className="absolute bottom-full left-0 mb-2 bg-gray-900 text-white rounded-lg p-2 shadow-xl z-20 min-w-[180px]">
              <div className="space-y-1">
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-800 rounded text-sm transition-colors">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Image className="w-4 h-4" />
                  </div>
                  <span>Upload a File</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-800 rounded text-sm transition-colors">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <span>Record Voice</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Input wrapper */}
        <div className={cn(
          "bg-gray-100 rounded-lg border transition-all duration-200",
          isExpanded ? "bg-white border-gray-300 shadow-sm" : "border-transparent",
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
                    ? "bg-gray-600 text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200",
                  disabled && "cursor-not-allowed"
                )}
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
                className={cn(
                  "w-full bg-transparent border-0 outline-none resize-none text-gray-900 placeholder-gray-500",
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
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors disabled:cursor-not-allowed"
              >
                <Gift className="w-5 h-5" />
              </button>

              {/* Sticker button */}
              <button
                type="button"
                disabled={disabled}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors disabled:cursor-not-allowed"
              >
                <Sticker className="w-5 h-5" />
              </button>

              {/* Emoji button */}
              <button
                type="button"
                disabled={disabled}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors disabled:cursor-not-allowed"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Send button - only show when there's text or when loading */}
              {(canSend || isLoading) && (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    canSend
                      ? "text-white bg-indigo-500 hover:bg-indigo-600"
                      : "text-gray-400 bg-gray-200 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Character counter */}
        {message.length > 1800 && (
          <div className="absolute -top-6 right-2 text-xs text-gray-500">
            <span className={cn(
              message.length > 2000 ? "text-red-500 font-semibold" : "text-gray-500"
            )}>
              {2000 - message.length}
            </span>
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="mt-2 text-xs text-gray-500">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
