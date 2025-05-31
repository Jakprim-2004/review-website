"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Plus, Users, Clock, RefreshCw } from "lucide-react"
import { subscribeToChatRooms, type ChatRoom } from "@/lib/chat"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface RoomListProps {
  onSelectRoom: (room: ChatRoom) => void
  onCreateRoom: () => void
  selectedRoomId?: string
}

export function RoomList({ onSelectRoom, onCreateRoom, selectedRoomId }: RoomListProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToChatRooms((newRooms) => {
      setRooms(newRooms)
      setLoading(false)
      setRefreshing(false)
    })

    return () => unsubscribe()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    // การเรียกใช้ subscribeToChatRooms อีกครั้งจะทำให้ข้อมูลอัปเดต
    // แต่เราไม่ต้องยกเลิกการสมัครสมาชิกเดิม เพราะเราใช้ useEffect
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "เมื่อสักครู่"
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`
    return `${diffDays} วันที่แล้ว`
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">ห้องแชท</h3>
          <Button variant="outline" size="sm" disabled>
            <Plus className="h-4 w-4 mr-1" />
            สร้างห้อง
          </Button>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between items-center mt-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">ห้องแชท</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={onCreateRoom}>
          <Plus className="h-4 w-4 mr-1" />
          สร้างห้อง
        </Button>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">ยังไม่มีห้องแชท สร้างห้องแรกเลย!</p>
          <Button onClick={onCreateRoom} className="bg-blue-500 hover:bg-blue-600">
            <Plus className="h-4 w-4 mr-1" />
            สร้างห้องแชท
          </Button>
        </div>
      ) : (
        rooms.map((room) => (
          <Card
            key={room.id}
            className={cn(
              "cursor-pointer hover:shadow-md transition-shadow",
              selectedRoomId === room.id ? "border-blue-500 shadow-md" : "",
              room.isLocal ? "border-l-4 border-l-amber-400" : "",
            )}
            onClick={() => onSelectRoom(room)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-800">{room.name}</h4>
                  <p className="text-sm text-gray-600 line-clamp-1">{room.description}</p>
                </div>
                {room.isLocal && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700">
                    เก็บในเครื่อง
                  </Badge>
                )}
              </div>
              <div className="flex justify-between items-center mt-2">
                
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeAgo(room.lastActivity)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
