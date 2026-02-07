"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import { getCurrentUser, onAuthStateChange, isDemoAdmin } from "@/lib/supabase"

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // ตรวจสอบโหมดทดลอง
    const checkDemo = isDemoAdmin()
    if (checkDemo) {
      setIsAdmin(true)
      return
    }

    // ติดตามการเปลี่ยนแปลงสถานะการเข้าสู่ระบบ
    const checkUser = async () => {
      const user = await getCurrentUser()
      if (user) {
        setIsAdmin(true)
      }
    }

    checkUser()

    // Subscribe to auth changes could be complex here as supabase returns an object
    // better to handle in a proper auth context, but for now let's rely on checking current user
  }, [])

  if (!isAdmin) return null

  return (
    <Link href="/admin/dashboard">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 transition-colors"
      >
        <ShieldAlert className="h-4 w-4" />
        จัดการรีวิว
      </Button>
    </Link>
  )
}
