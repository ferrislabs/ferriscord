import { useState, useRef, useEffect, type KeyboardEvent } from "react";
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
  Loader2,
  FileText,
  Film,
} from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string, files?: File[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  channelName?: string;
  channelType?: 'text' | 'dm';
  recipientName?: string;
}

const INPUT_TEXT_PREVIEWABLE_TYPES = new Set([
  "application/json", "application/xml", "application/yaml",
  "application/x-yaml", "application/toml",
]);
const INPUT_TEXT_PREVIEWABLE_EXTS = new Set([
  "txt", "md", "mdx", "rst", "json", "xml", "yaml", "yml", "toml", "csv",
  "rs", "py", "js", "ts", "jsx", "tsx", "go", "java", "c", "cpp", "h",
  "css", "html", "sh", "bash", "env", "ini", "conf", "log",
]);

function isInputTextPreviewable(file: File): boolean {
  if (file.type.startsWith("text/")) return true;
  if (INPUT_TEXT_PREVIEWABLE_TYPES.has(file.type)) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return INPUT_TEXT_PREVIEWABLE_EXTS.has(ext);
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const isText = isInputTextPreviewable(file);
  const [objectUrl] = useState(() =>
    isImage || isVideo ? URL.createObjectURL(file) : "",
  );
  const [textSnippet, setTextSnippet] = useState<string>("");

  useEffect(() => {
    if (!isText) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) ?? "";
      setTextSnippet(content.slice(0, 120).replace(/\r\n/g, "\n"));
    };
    reader.readAsText(file.slice(0, 500));
  }, [file, isText]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="relative group flex-shrink-0">
      <div className="w-24 h-24 rounded-lg overflow-hidden border border-border bg-accent/50 flex items-center justify-center">
        {isImage ? (
          <img
            src={objectUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : isVideo ? (
          <div className="flex flex-col items-center text-muted-foreground">
            <Film className="w-8 h-8 mb-1" />
            <span className="text-xs truncate w-20 text-center px-1">{file.name}</span>
          </div>
        ) : isText ? (
          <div className="w-full h-full p-1.5 overflow-hidden">
            <pre className="text-[9px] font-mono text-muted-foreground leading-tight whitespace-pre-wrap break-all line-clamp-5">
              {textSnippet || "…"}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <FileText className="w-8 h-8 mb-1" />
            <span className="text-xs truncate w-20 text-center px-1">{file.name}</span>
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
        {formatSize(file.size)}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        aria-label={`Remove ${file.name}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
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
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate appropriate placeholder
  let defaultPlaceholder = `Message #${channelName}`;
  if (channelType === 'dm' && recipientName) {
    defaultPlaceholder = `Message @${recipientName}`;
  }
  const actualPlaceholder = placeholder || defaultPlaceholder;

  const handleSend = () => {
    const trimmedMessage = message.trim();
    const hasFiles = files.length > 0;
    if ((trimmedMessage || hasFiles) && !isLoading && !disabled) {
      onSendMessage(trimmedMessage, hasFiles ? files : undefined);
      setMessage("");
      setFiles([]);
      setIsExpanded(false);
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

    if (e.target.value.length > 0 && !isExpanded) {
      setIsExpanded(true);
    } else if (e.target.value.length === 0 && isExpanded && files.length === 0) {
      setIsExpanded(false);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.max(20, Math.min(textarea.scrollHeight, 200));
      textarea.style.height = `${newHeight}px`;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected].slice(0, 10)); // max 10 files
      setIsExpanded(true);
    }
    // Reset input so the same file can be re-selected
    e.target.value = "";
    setShowFileMenu(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0 && message.trim().length === 0) {
        setIsExpanded(false);
      }
      return next;
    });
  };

  const canSend = (message.trim().length > 0 || files.length > 0) && !isLoading && !disabled;

  return (
    <div className={cn("px-4 pb-4 border-t border-sidebar-border bg-background", className)}>
      {/* Typing indicator */}
      <div className="mb-2 h-5 flex items-center">
        <div className="text-sm text-muted-foreground" />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.txt,.doc,.docx,.zip,.tar,.gz"
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
      />

      {/* Main input container */}
      <div className="relative">
        {/* File upload menu */}
        {showFileMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowFileMenu(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 bg-popover text-popover-foreground rounded-lg p-2 shadow-xl z-20 min-w-[180px] border border-border">
              <div className="space-y-1">
                <button
                  className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-accent hover:text-accent-foreground rounded text-sm transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
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
          {/* File previews */}
          {files.length > 0 && (
            <div className="flex gap-2 p-3 pb-0 flex-wrap">
              {files.map((file, index) => (
                <FilePreview
                  key={`${file.name}-${index}`}
                  file={file}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          )}

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
              <button
                type="button"
                disabled={disabled}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors disabled:cursor-not-allowed"
                aria-label="Send gift"
              >
                <Gift className="w-5 h-5" />
              </button>
              <button
                type="button"
                disabled={disabled}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors disabled:cursor-not-allowed"
                aria-label="Send sticker"
              >
                <Sticker className="w-5 h-5" />
              </button>
              <button
                type="button"
                disabled={disabled}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors disabled:cursor-not-allowed"
                aria-label="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

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
        Press <kbd className="px-1 py-0.5 bg-accent rounded text-xs">Enter</kbd> to send,{" "}
        <kbd className="px-1 py-0.5 bg-accent rounded text-xs">Shift+Enter</kbd> for new line
      </div>
    </div>
  );
}
