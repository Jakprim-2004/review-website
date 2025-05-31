"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { RoomList } from "./room-list"
import { CreateRoomDialog } from "./create-room-dialog"
import {
  addChatMessage,
  subscribeToChatMessages,
  type ChatMessage,
  type ChatRoom,
  getUserDisplayName,
  saveUserDisplayName,
  joinChatRoom,
  leaveChatRoom,
  setupRoomCleanupInterval,
  getChatRoom,
} from "@/lib/chat"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { MessageSquare, Users, ArrowLeft, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ChatBox() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [isSettingName, setIsSettingName] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [createRoomDialogOpen, setCreateRoomDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("rooms")
  const [error, setError] = useState<string | null>(null)

  // โหลดชื่อผู้ใช้จาก localStorage
  useEffect(() => {
    const storedName = getUserDisplayName()
    if (storedName) {
      setUsername(storedName)
    } else {
      setIsSettingName(true)
    }

    // ตั้งเวลาตรวจสอบและลบห้องที่ไม่มีกิจกรรม
    let cleanupInterval: number | null = null
    try {
      cleanupInterval = setupRoomCleanupInterval()
    } catch (error) {
      console.error("Failed to setup room cleanup interval:", error)
      // ไม่ต้องทำอะไรเพิ่มเติม เพราะนี่เป็นฟีเจอร์เสริม ไม่ใช่ฟังก์ชันหลัก
    }

    return () => {
      if (cleanupInterval) clearInterval(cleanupInterval)
    }
  }, [])

  // เมื่อเลือกห้อง
  useEffect(() => {
    if (selectedRoom) {
      setLoading(true)
      setError(null)
      setActiveTab("chat")

      console.log("Selected room:", selectedRoom.id, selectedRoom.name)

      // เข้าร่วมห้อง
      joinChatRoom(selectedRoom.id).then((success) => {
        if (!success) {
          console.warn("Failed to join room:", selectedRoom.id)
        }
      })

      // ติดตามข้อความในห้อง
      const unsubscribe = subscribeToChatMessages(selectedRoom.id, (newMessages) => {
        console.log("Received messages:", newMessages.length)
        setMessages(newMessages)
        setLoading(false)
      })

      return () => {
        console.log("Cleaning up room subscription")
        unsubscribe()
        // ออกจากห้องเมื่อออกจากคอมโพเนนต์หรือเปลี่ยนห้อง
        if (selectedRoom) {
          leaveChatRoom(selectedRoom.id).then((success) => {
            if (!success) {
              console.warn("Failed to leave room:", selectedRoom.id)
            }
          })
        }
      }
    } else {
      setMessages([])
    }
  }, [selectedRoom])

  // บันทึกชื่อผู้ใช้
  const handleSetUsername = () => {
    if (username.trim()) {
      saveUserDisplayName(username.trim())
      setIsSettingName(false)
      toast({
        title: "ตั้งชื่อสำเร็จ",
        description: `คุณจะแสดงเป็น "${username.trim()}" ในแชท`,
      })
    }
  }

  // ส่งข้อความ
  const handleSendMessage = async (text: string) => {
    if (!username) {
      setIsSettingName(true)
      return
    }

    if (!selectedRoom) {
      toast({
        title: "กรุณาเลือกห้องแชท",
        description: "คุณต้องเลือกห้องแชทก่อนส่งข้อความ",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    setError(null)

    try {
      console.log("Sending message:", text, "to room:", selectedRoom.id)
      const result = await addChatMessage({
        text,
        author: username,
        roomId: selectedRoom.id,
      })

      if (!result.success) {
        console.error("Failed to send message:", result.error)
        setError("ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง")
        toast({
          title: "ส่งข้อความไม่สำเร็จ",
          description: result.error || "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      let errorMessage = "เกิดข้อผิดพลาดในการส่งข้อความ"

      // ตรวจสอบว่าเป็นข้อผิดพลาดเกี่ยวกับ index หรือไม่
      if (error.toString().includes("index")) {
        errorMessage = "เกิดข้อผิดพลาดเกี่ยวกับ index ใน Firebase โปรดตรวจสอบคอนโซลเพื่อดูลิงก์สำหรับสร้าง index"
      }

      setError(errorMessage)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  // เลือกห้องแชท
  const handleSelectRoom = useCallback(
    async (room: ChatRoom) => {
      try {
        console.log("Selecting room:", room.id, room.name)

        // ถ้ากำลังอยู่ในห้องปัจจุบัน ให้ออกจากห้องก่อน
        if (selectedRoom) {
          await leaveChatRoom(selectedRoom.id)
        }

        // ตรวจสอบว่าห้องยังมีอยู่หรือไม่
        if (!room.isLocal) {
          const roomData = await getChatRoom(room.id)
          if (!roomData) {
            toast({
              title: "ไม่พบห้องแชท",
              description: "ห้องแชทนี้อาจถูกลบไปแล้ว",
              variant: "destructive",
            })
            return
          }
        }

        setSelectedRoom(room)
      } catch (error) {
        console.error("Error selecting room:", error)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถเข้าร่วมห้องแชทได้",
          variant: "destructive",
        })
      }
    },
    [selectedRoom],
  )

  // สร้างห้องแชทใหม่
  const handleCreateRoom = () => {
    setCreateRoomDialogOpen(true)
  }

  // เมื่อสร้างห้องแชทสำเร็จ
  const handleRoomCreated = async (roomId: string) => {
    try {
      console.log("Room created:", roomId)

      // สำหรับห้องที่เก็บใน localStorage
      if (roomId.startsWith("local_")) {
        const storedRooms = localStorage.getItem("local_chat_rooms")
        if (storedRooms) {
          const rooms = JSON.parse(storedRooms)
          const newRoom = rooms.find((r: any) => r.id === roomId)
          if (newRoom) {
            setSelectedRoom({
              ...newRoom,
              createdAt: new Date(newRoom.createdAt),
              lastActivity: new Date(newRoom.lastActivity),
              isLocal: true,
            })
            return
          }
        }
      }

      // สำหรับห้องที่เก็บใน Firebase
      // ดึงข้อมูลห้องที่สร้างใหม่
      const roomData = await getChatRoom(roomId)
      if (roomData) {
        setSelectedRoom(roomData)
      } else {
        // ถ้าไม่พบห้อง ให้กลับไปที่รายการห้อง
        setActiveTab("rooms")
        toast({
          title: "สร้างห้องแชทสำเร็จ",
          description: "กรุณาเลือกห้องแชทจากรายการ",
        })
      }
    } catch (error) {
      console.error("Error after room creation:", error)
      setActiveTab("rooms")
    }
  }

  // กลับไปหน้ารายการห้อง
  const handleBackToRooms = () => {
    setActiveTab("rooms")
  }

  // แสดงหน้าตั้งชื่อ
  if (isSettingName) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            ตั้งชื่อในแชท
          </CardTitle>
          <CardDescription>กรุณาตั้งชื่อที่จะแสดงในแชท</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ชื่อของคุณ</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ใส่ชื่อของคุณ"
                className="focus-visible:ring-blue-500"
              />
            </div>
            <Button
              onClick={handleSetUsername}
              disabled={!username.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              เริ่มแชท
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              ระบบแชท
            </CardTitle>
            <CardDescription>พูดคุยกับผู้ใช้คนอื่นๆ ในห้องแชทต่างๆ</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsSettingName(true)} className="text-xs">
            แชทในชื่อ: {username}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b">
            <div className="container mx-auto">
              <TabsList className="h-12">
                <TabsTrigger value="rooms" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  ห้องแชท
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-1" disabled={!selectedRoom}>
                  <MessageSquare className="h-4 w-4" />
                  {selectedRoom ? selectedRoom.name : "แชท"}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="rooms" className="p-4">
            <RoomList
              onSelectRoom={handleSelectRoom}
              onCreateRoom={handleCreateRoom}
              selectedRoomId={selectedRoom?.id}
            />
          </TabsContent>

          <TabsContent value="chat" className="p-0">
            {selectedRoom ? (
              <>
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleBackToRooms}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <h3 className="font-medium">{selectedRoom.name}</h3>
                      <p className="text-xs text-gray-500">{selectedRoom.description}</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="m-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {error}
                      {error.includes("index") && (
                        <div className="mt-2 text-xs">
                          <p>ข้อผิดพลาดนี้เกิดจากการขาด index ใน Firebase</p>
                          <p>โปรดคลิกที่ลิงก์ในคอนโซลเพื่อสร้าง index</p>
                          <p className="mt-1 font-semibold">วิธีแก้ไข:</p>
                          <ol className="list-decimal ml-4">
                            <li>เปิด Developer Console (F12 หรือคลิกขวา {">"} Inspect)</li>
                            <li>ไปที่แท็บ Console</li>
                            <li>คลิกที่ลิงก์ที่ขึ้นต้นด้วย https://console.firebase.google.com/</li>
                            <li>คลิก "Create index" ในหน้า Firebase Console</li>
                          </ol>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-sm text-gray-500">กำลังโหลดข้อความ...</p>
                  </div>
                ) : (
                  <MessageList messages={messages} currentUser={username} />
                )}
                <Separator />
                <MessageInput onSendMessage={handleSendMessage} disabled={isSending} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <MessageSquare className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium mb-1">กรุณาเลือกห้องแชท</h3>
                <p className="text-gray-500 mb-4">เลือกห้องแชทจากรายการเพื่อเริ่มการสนทนา</p>
                <Button onClick={handleBackToRooms} variant="outline">
                  ไปที่รายการห้องแชท
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <CreateRoomDialog
        open={createRoomDialogOpen}
        onOpenChange={setCreateRoomDialogOpen}
        onRoomCreated={handleRoomCreated}
      />
    </Card>
  )
}
