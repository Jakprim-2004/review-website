"use client"

import { useEffect, useRef } from "react"
import type { ChatMessage } from "@/lib/chat"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { AlertCircle } from "lucide-react"

interface MessageListProps {
  messages: ChatMessage[]
  currentUser: string
}

export function MessageList({ messages, currentUser }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // เลื่อนไปที่ข้อความล่าสุดเมื่อมีข้อความใหม่
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
        <div className="bg-blue-100 p-3 rounded-full mb-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-500"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M13 8h2" />
            <path d="M13 12h2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-1">ยังไม่มีข้อความ</h3>
        <p className="text-gray-500">เริ่มพูดคุยโดยส่งข้อความแรกของคุณ</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-4 p-4 overflow-y-auto h-[400px]">
      {messages.map((message) => {
        const isCurrentUser = message.author === currentUser
        return (
          <div key={message.id} className={cn("flex", isCurrentUser ? "justify-end" : "justify-start")}>
            <div className="flex items-start gap-2 max-w-[80%]">
              {!isCurrentUser && (
                <Avatar className="h-8 w-8 bg-blue-100">
                  <AvatarFallback className="text-blue-500">{message.author.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              <div>
                {!isCurrentUser && <div className="text-xs text-gray-500 mb-1">{message.author}</div>}
                <div
                  className={cn(
                    "rounded-lg p-3 text-sm",
                    isCurrentUser
                      ? "bg-blue-500 text-white rounded-tr-none"
                      : "bg-gray-100 text-gray-800 rounded-tl-none",
                  )}
                >
                  {message.text}
                  {message.isLocal && (
                    <span className="inline-flex ml-1 text-xs opacity-70">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      เก็บในเครื่อง
                    </span>
                  )}
                </div>
                <div className={cn("text-xs mt-1", isCurrentUser ? "text-right text-gray-500" : "text-gray-500")}>
                  {message.createdAt instanceof Date
                    ? message.createdAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "กำลังส่ง..."}
                </div>
              </div>
              {isCurrentUser && (
                <Avatar className="h-8 w-8 bg-blue-500">
                  <AvatarFallback className="text-white">{message.author.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
