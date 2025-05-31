"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import { getCurrentUser, onAuthStateChange, isDemoAdmin } from "@/lib/firebase"

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // ตรวจสอบโหมดทดลอง
    if (isDemoAdmin()) {
      setIsAdmin(true)
      return
    }

    // ตรวจสอบว่าผู้ใช้เข้าสู่ระบบแล้วหรือไม่
    const currentUser = getCurrentUser()
    if (currentUser) {
      setIsAdmin(true)
    }

    // ติดตามการเปลี่ยนแปลงสถานะการเข้าสู่ระบบ
    const unsubscribe = onAuthStateChange((user) => {
      setIsAdmin(!!user)
    })

    return () => unsubscribe()
  }, [])

  if (!isAdmin) return null

  return (
    <Link href="/admin/dashboard">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors"
      >
        <ShieldAlert className="h-4 w-4" />
        จัดการรีวิว
      </Button>
    </Link>
  )
}
