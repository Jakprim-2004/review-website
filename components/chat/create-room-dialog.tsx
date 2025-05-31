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
import { createChatRoom, getUserDisplayName } from "@/lib/chat"
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
      const username = getUserDisplayName() || "ผู้ใช้ไม่ระบุชื่อ"
      const result = await createChatRoom({
        name: roomName.trim(),
        description: roomDescription.trim() || "ไม่มีคำอธิบาย",
        createdBy: username,
      })

      if (result.success) {
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
          description: result.error || "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      }
    } catch (error) {
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
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>สร้างห้องแชทใหม่</DialogTitle>
            <DialogDescription>
              สร้างห้องแชทใหม่เพื่อพูดคุยกับผู้ใช้คนอื่นๆ ห้องจะหายไปโดยอัตโนมัติหากไม่มีผู้ใช้ในห้องเป็นเวลา 30 นาที
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roomName">ชื่อห้อง</Label>
              <Input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="ใส่ชื่อห้อง"
                className="focus-visible:ring-blue-500"
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
                placeholder="อธิบายเกี่ยวกับห้องนี้"
                className="focus-visible:ring-blue-500"
                maxLength={200}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting || !roomName.trim()} className="bg-blue-500 hover:bg-blue-600">
              {isSubmitting ? "กำลังสร้าง..." : "สร้างห้อง"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
