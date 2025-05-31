import { ChatBox } from "@/components/chat/chat-box"
import Link from "next/link"
import { ArrowLeft, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function ChatPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <Link href="/" className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับไปหน้าหลัก
      </Link>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ระบบแชท
        </h1>
        <p className="text-center text-gray-600 mb-4">สร้างห้องแชทหรือเข้าร่วมห้องที่มีอยู่แล้วเพื่อพูดคุยกับผู้ใช้คนอื่นๆ แบบเรียลไทม์</p>

       

        <ChatBox />
      </div>
    </div>
  )
}
