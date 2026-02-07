"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageList } from "./message-list"
import { MessageInput } from "./message-input"
import { RoomList } from "./room-list"
import { CreateRoomDialog } from "./create-room-dialog"
import {
  getChatRooms as getSupabaseChatRooms,
  getChatMessages,
  sendChatMessage,
  subscribeToMessages,
  createChatRoom as createSupabaseChatRoom,
  getCurrentUser,
  onAuthStateChange,
  type ChatRoom,
  type ChatMessage,
} from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { MessageSquare, Users, ArrowLeft, AlertCircle, LogIn, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

// Transform Supabase ChatMessage to MessageList format
interface DisplayMessage {
  id: string
  text: string
  author: string
  createdAt: Date
  roomId: string
  avatar_url?: string
}

// Transform Supabase ChatRoom to RoomList format
interface DisplayRoom {
  id: string
  name: string
  description: string
  createdAt: Date
  lastActivity: Date
  createdBy: string
  activeUsers: number
  isLocal?: boolean
}

export function ChatBox() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [rooms, setRooms] = useState<DisplayRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [username, setUsername] = useState("")
  const [user, setUser] = useState<any>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<DisplayRoom | null>(null)
  const [createRoomDialogOpen, setCreateRoomDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("rooms")
  const [error, setError] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // ดึงข้อมูล user ที่ login
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      if (currentUser) {
        const displayName = currentUser.user_metadata?.display_name ||
          currentUser.email?.split("@")[0] ||
          "ผู้ใช้งาน"
        setUsername(displayName)
      }
      setUserLoading(false)
    }
    checkUser()

    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const displayName = currentUser.user_metadata?.display_name ||
          currentUser.email?.split("@")[0] ||
          "ผู้ใช้งาน"
        setUsername(displayName)
      }
      setUserLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // ดึงรายการห้องแชทจาก Supabase
  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true)
    try {
      const roomsData = await getSupabaseChatRooms()
      const transformedRooms: DisplayRoom[] = roomsData.map((room: ChatRoom) => ({
        id: room.id,
        name: room.name,
        description: room.description || "",
        createdAt: new Date(room.created_at),
        lastActivity: new Date(room.last_activity),
        createdBy: room.created_by || "",
        activeUsers: 0,
      }))
      setRooms(transformedRooms)
    } catch (error) {
      console.error("Error fetching rooms:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดรายการห้องแชทได้",
        variant: "destructive",
      })
    } finally {
      setLoadingRooms(false)
    }
  }, [])

  // โหลดห้องแชทเมื่อเริ่มต้น
  useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  // เมื่อเลือกห้อง - โหลดข้อความและ subscribe to realtime
  useEffect(() => {
    if (selectedRoom) {
      setLoading(true)
      setError(null)
      setActiveTab("chat")

      // ดึงข้อความเก่าจาก Supabase
      const fetchMessages = async () => {
        try {
          setHasMore(true)
          const messagesData = await getChatMessages(selectedRoom.id, 50)
          const transformedMessages: DisplayMessage[] = messagesData.map((msg: ChatMessage) => ({
            id: msg.id,
            text: msg.content,
            author: msg.author,
            createdAt: new Date(msg.created_at),
            roomId: msg.room_id,
            avatar_url: msg.avatar_url,
          }))
          setMessages(transformedMessages)
          if (messagesData.length < 50) setHasMore(false)
        } catch (error) {
          console.error("Error fetching messages:", error)
          setError("ไม่สามารถโหลดข้อความได้")
        } finally {
          setLoading(false)
        }
      }

      fetchMessages()

      // Subscribe to realtime messages
      const unsubscribe = subscribeToMessages(selectedRoom.id, (newMessage: ChatMessage) => {
        const transformedMessage: DisplayMessage = {
          id: newMessage.id,
          text: newMessage.content,
          author: newMessage.author,
          createdAt: new Date(newMessage.created_at),
          roomId: newMessage.room_id,
          avatar_url: newMessage.avatar_url,
        }
        setMessages((prev) => [...prev, transformedMessage])
      })

      return () => {
        unsubscribe()
      }
    } else {
      setMessages([])
    }
  }, [selectedRoom])

  // ส่งข้อความ
  const handleSendMessage = async (text: string) => {
    if (!username) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบก่อนส่งข้อความ",
        variant: "destructive",
      })
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
      const result = await sendChatMessage(selectedRoom.id, {
        author: username,
        content: text,
        user_id: user.id,
        avatar_url: user.user_metadata?.avatar_url,
      })

      if (!result) {
        setError("ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง")
        toast({
          title: "ส่งข้อความไม่สำเร็จ",
          description: "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      }
      // ไม่ต้อง add message เอง เพราะ realtime subscription จะจัดการให้
    } catch (error) {
      console.error("Error sending message:", error)
      setError("เกิดข้อผิดพลาดในการส่งข้อความ")
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
  const handleSelectRoom = useCallback((room: DisplayRoom) => {
    setSelectedRoom(room)
  }, [])

  // สร้างห้องแชทใหม่
  const handleCreateRoom = () => {
    setCreateRoomDialogOpen(true)
  }

  // เมื่อสร้างห้องแชทสำเร็จ
  const handleRoomCreated = async (roomId: string) => {
    // Refresh room list
    await fetchRooms()

    // Find and select the new room
    const newRoom = rooms.find(r => r.id === roomId)
    if (newRoom) {
      setSelectedRoom(newRoom)
    }

    toast({
      title: "สร้างห้องแชทสำเร็จ",
      description: "ห้องแชทใหม่ถูกสร้างเรียบร้อยแล้ว",
    })
  }

  // กลับไปหน้ารายการห้อง
  const handleBackToRooms = () => {
    setActiveTab("rooms")
  }

  const loadMoreMessages = async () => {
    if (!selectedRoom || isLoadingMore || !messages.length) return
    setIsLoadingMore(true)
    try {
      const oldestMessageId = messages[0].id
      const olderMessages = await getChatMessages(selectedRoom.id, 50, oldestMessageId)

      if (olderMessages.length > 0) {
        const transformedMessages: DisplayMessage[] = olderMessages.map((msg: ChatMessage) => ({
          id: msg.id,
          text: msg.content,
          author: msg.author,
          createdAt: new Date(msg.created_at),
          roomId: msg.room_id,
          avatar_url: msg.avatar_url,
        }))
        setMessages(prev => [...transformedMessages, ...prev])
        if (olderMessages.length < 50) setHasMore(false)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Error loading more messages:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Loading state
  if (userLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  // ถ้ายังไม่ได้ login
  if (!user) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
          <LogIn className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">กรุณาเข้าสู่ระบบ</h3>
        <p className="text-slate-500 mb-6">คุณต้องเข้าสู่ระบบก่อนจึงจะใช้งานแชทได้</p>
        <Link href="/auth">
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
            <LogIn className="w-4 h-4 mr-2" />
            เข้าสู่ระบบ
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold flex items-center gap-2 text-slate-800">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              ระบบแชท
            </h3>
            <p className="text-sm text-slate-500">พูดคุยกับผู้ใช้คนอื่นๆ ในห้องแชทต่างๆ</p>
          </div>
         
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b">
          <div className="px-4">
            <TabsList className="h-12 bg-transparent">
              <TabsTrigger value="rooms" className="flex items-center gap-1.5 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 rounded-lg">
                <Users className="h-4 w-4" />
                ห้องแชท
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-1.5 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 rounded-lg" disabled={!selectedRoom}>
                <MessageSquare className="h-4 w-4" />
                {selectedRoom ? selectedRoom.name : "แชท"}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="rooms" className="p-4 m-0">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-slate-700">ห้องแชททั้งหมด ({rooms.length})</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRooms}
                disabled={loadingRooms}
                className="rounded-lg"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loadingRooms ? "animate-spin" : ""}`} />
                รีเฟรช
              </Button>
              <Button
                size="sm"
                onClick={handleCreateRoom}
                className="rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                + สร้างห้องใหม่
              </Button>
            </div>
          </div>

          {loadingRooms ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : rooms.length > 0 ? (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedRoom?.id === room.id
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-slate-800">{room.name}</h5>
                      <p className="text-sm text-slate-500">{room.description || "ไม่มีคำอธิบาย"}</p>
                    </div>
                    <div className="text-xs text-slate-400">
                      {room.lastActivity.toLocaleDateString("th-TH")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
              <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">ยังไม่มีห้องแชท</p>
              <Button onClick={handleCreateRoom} className="rounded-xl bg-blue-600 hover:bg-blue-700">
                สร้างห้องแชทแรก
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat" className="p-0 m-0">
          {selectedRoom ? (
            <>
              <div className="p-4 border-b bg-slate-50">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200" onClick={handleBackToRooms}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h3 className="font-medium text-slate-800">{selectedRoom.name}</h3>
                    <p className="text-xs text-slate-500">{selectedRoom.description}</p>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="m-4 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center h-[400px]">
                  <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                  <p className="mt-3 text-sm text-slate-500">กำลังโหลดข้อความ...</p>
                </div>
              ) : (
                <div className="flex flex-col h-[400px]">
                  {hasMore && (
                    <div className="text-center py-2 bg-slate-50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMoreMessages}
                        disabled={isLoadingMore}
                        className="text-xs text-slate-400 hover:text-blue-600"
                      >
                        {isLoadingMore ? "กำลังโหลด..." : "โหลดข้อความเก่า"}
                      </Button>
                    </div>
                  )}
                  <MessageList messages={messages} currentUser={username} />
                </div>
              )}
              <Separator />
              <MessageInput onSendMessage={handleSendMessage} disabled={isSending} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-slate-800">กรุณาเลือกห้องแชท</h3>
              <p className="text-slate-500 mb-4">เลือกห้องแชทจากรายการเพื่อเริ่มการสนทนา</p>
              <Button onClick={handleBackToRooms} variant="outline" className="rounded-xl">
                ไปที่รายการห้องแชท
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateRoomDialog
        open={createRoomDialogOpen}
        onOpenChange={setCreateRoomDialogOpen}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  )
}
