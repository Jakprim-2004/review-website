"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createChatRoom } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"

interface CreateRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoomCreated?: (roomId: string) => void
}

export function CreateRoomDialog({ open, onOpenChange, onRoomCreated }: CreateRoomDialogProps) {
  const [roomName, setRoomName] = useState("")
  const [roomDescription, setRoomDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roomName.trim()) {
      toast({
        title: "กรุณาใส่ชื่อห้อง",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createChatRoom({
        name: roomName.trim(),
        description: roomDescription.trim() || "ไม่มีคำอธิบาย",
      })

      if (result) {
        toast({
          title: "สร้างห้องแชทสำเร็จ",
          description: `ห้อง "${roomName}" ถูกสร้างแล้ว`,
        })
        setRoomName("")
        setRoomDescription("")
        onOpenChange(false)

        if (onRoomCreated && result.id) {
          onRoomCreated(result.id)
        }
      } else {
        toast({
          title: "สร้างห้องแชทไม่สำเร็จ",
          description: "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating room:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างห้องแชทได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>สร้างห้องแชทใหม่</DialogTitle>
            <DialogDescription>
              สร้างห้องแชทใหม่เพื่อพูดคุยกับผู้ใช้คนอื่นๆ
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomName">ชื่อห้อง <span className="text-red-500">*</span></Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="เช่น ห้องพูดคุยทั่วไป"
                className="rounded-xl focus-visible:ring-blue-500"
                maxLength={50}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roomDescription">คำอธิบาย (ไม่บังคับ)</Label>
              <Textarea
                id="roomDescription"
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                placeholder="อธิบายเกี่ยวกับห้องนี้..."
                className="rounded-xl focus-visible:ring-blue-500 resize-none"
                rows={3}
                maxLength={200}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !roomName.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังสร้าง...
                </div>
              ) : (
                "สร้างห้อง"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
