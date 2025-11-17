'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Send } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { useUserStore } from '@/store/userStore'
import { getSocket } from '@/lib/socket'
import EmojiPicker from './EmojiPicker'

const messageSchema = z.object({
  content: z
    .string()
    .min(1, '訊息不能為空')
    .max(500, '訊息最多 500 個字元'),
})

type MessageFormData = z.infer<typeof messageSchema>

export default function MessageInput() {
  const { currentRoom } = useChatStore()
  const currentUser = useUserStore((state) => state.currentUser)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: '',
    },
  })

  const messageContent = watch('content')

  // Handle typing indicator
  useEffect(() => {
    if (!currentRoom || !currentUser) return

    const socket = getSocket()

    if (messageContent.trim().length > 0) {
      if (!isTyping) {
        setIsTyping(true)
        socket.emit('typing:start', {
          roomId: currentRoom.id,
          userId: currentUser.id,
          username: currentUser.nickname,
        })
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        socket.emit('typing:stop', {
          roomId: currentRoom.id,
          userId: currentUser.id,
        })
      }, 2000)
    } else {
      if (isTyping) {
        setIsTyping(false)
        socket.emit('typing:stop', {
          roomId: currentRoom.id,
          userId: currentUser.id,
        })
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [messageContent, currentRoom, currentUser, isTyping])

  const onSubmit = (data: MessageFormData) => {
    if (!currentRoom || !currentUser) return

    const socket = getSocket()

    // Send message
    socket.emit('message:send', {
      roomId: currentRoom.id,
      userId: currentUser.id,
      username: currentUser.nickname,
      content: data.content.trim(),
      timestamp: new Date().toISOString(),
    })

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false)
      socket.emit('typing:stop', {
        roomId: currentRoom.id,
        userId: currentUser.id,
      })
    }

    // Reset form
    reset()

    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const currentValue = messageContent || ''
    const cursorPosition = textareaRef.current?.selectionStart || currentValue.length
    const newValue =
      currentValue.slice(0, cursorPosition) +
      emoji +
      currentValue.slice(cursorPosition)

    setValue('content', newValue)

    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.selectionStart = cursorPosition + emoji.length
        textareaRef.current.selectionEnd = cursorPosition + emoji.length
      }
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
  }

  if (!currentRoom) {
    return null
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
        {/* Emoji Picker */}
        <EmojiPicker onEmojiSelect={handleEmojiSelect} />

        {/* Message Input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            {...register('content')}
            onKeyDown={handleKeyDown}
            placeholder="輸入訊息...（Enter 發送，Shift+Enter 換行）"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none scrollbar-thin"
            rows={1}
            style={{
              minHeight: '40px',
              maxHeight: '120px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`
            }}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600 animate-fade-in">
              {errors.content.message}
            </p>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!messageContent?.trim()}
          className="p-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex-shrink-0"
          title="發送訊息"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  )
}
