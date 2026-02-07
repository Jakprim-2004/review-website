"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
    const router = useRouter()

    useEffect(() => {
        // เมื่อ redirect กลับมาหน้านี้ Supabase Client จะตรวจจับ session ให้อัตโนมัติ
        // เราแค่รอสักครู่แล้ว redirect ไปหน้าหลัก
        const handleAuth = async () => {
            // รอให้ Supabase process hash/code
            await supabase.auth.getSession()

            // Redirect ไปหน้าแรก
            router.push("/")
            router.refresh() // Force refresh เพื่อให้ UI อัพเดทสถานะ Login
        }

        handleAuth()
    }, [router])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">กำลังยืนยันตัวตน...</h2>
            <p className="text-gray-500 text-sm mt-2">กรุณารอสักครู่</p>
        </div>
    )
}
