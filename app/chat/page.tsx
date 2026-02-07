"use client"

import { ChatBox } from "@/components/chat/chat-box"
import Link from "next/link"
import { ArrowLeft, MessageCircle, Users, Zap } from "lucide-react"

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center mb-8 text-slate-600 hover:text-slate-900 transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            กลับหน้าหลัก
          </Link>

          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-4 shadow-lg">
              <MessageCircle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              ระบบแชท
            </h1>
            <p className="text-slate-500 max-w-md mx-auto">
              สร้างห้องแชทหรือเข้าร่วมห้องที่มีอยู่เพื่อพูดคุยกับผู้ใช้คนอื่นๆ แบบเรียลไทม์
            </p>
          </div>

          {/* Features Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              เรียลไทม์
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
              <Users className="w-4 h-4" />
              หลายห้องแชท
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              <MessageCircle className="w-4 h-4" />
              ใช้งานง่าย
            </div>
          </div>

          {/* Chat Component */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <ChatBox />
          </div>
        </div>
      </div>
    </div>
  )
}
