import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onAddReaction?: (emoji: string) => void;
  onRemoveReaction?: (emoji: string) => void;
  className?: string;
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "👎", "🎉"];

export function MessageReactions({
  reactions,
  onAddReaction,
  onRemoveReaction,
  className
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleReactionClick = (reaction: Reaction) => {
    if (reaction.hasReacted && onRemoveReaction) {
      onRemoveReaction(reaction.emoji);
    } else if (!reaction.hasReacted && onAddReaction) {
      onAddReaction(reaction.emoji);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    if (onAddReaction) {
      onAddReaction(emoji);
    }
    setShowEmojiPicker(false);
  };

  if (reactions.length === 0 && !onAddReaction) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1 mt-1", className)}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionClick(reaction)}
          className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-md text-sm transition-colors border",
            reaction.hasReacted
              ? "bg-indigo-100 border-indigo-300 text-indigo-700"
              : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
          )}
        >
          <span className="text-sm">{reaction.emoji}</span>
          <span className="text-xs font-medium">{reaction.count}</span>
        </button>
      ))}

      {onAddReaction && (
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors border border-gray-200"
          >
            <Plus className="w-4 h-4" />
          </button>

          {showEmojiPicker && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowEmojiPicker(false)}
              />

              {/* Emoji picker */}
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20 min-w-[200px]">
                <div className="grid grid-cols-4 gap-2">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="p-2 text-lg hover:bg-gray-100 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
