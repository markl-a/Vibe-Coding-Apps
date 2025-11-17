'use client'

import { useState } from 'react'
import { Smile } from 'lucide-react'

const EMOJI_CATEGORIES = {
  '常用': ['😀', '😁', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤔', '🙄', '😴'],
  '手勢': ['👍', '👎', '👏', '🙌', '👋', '🤝', '✌️', '🤞', '🤙', '👌', '🙏', '💪'],
  '表情': ['❤️', '💕', '💖', '💗', '💙', '💚', '💛', '🧡', '💜', '🖤', '💔', '💯'],
  '其他': ['🎉', '🎊', '🎈', '🎁', '🔥', '⭐', '✨', '💫', '🌟', '⚡', '💥', '🚀'],
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  className?: string
}

export default function EmojiPicker({ onEmojiSelect, className = '' }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('常用')

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Emoji Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="插入表情符號"
      >
        <Smile className="w-5 h-5 text-gray-600" />
      </button>

      {/* Emoji Picker Popup */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Picker */}
          <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 w-72 animate-slide-up">
            {/* Category Tabs */}
            <div className="flex border-b border-gray-200 p-2 gap-1">
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
                  className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    activeCategory === category
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="p-3 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto scrollbar-thin">
              {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:bg-gray-100 rounded p-2 transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
