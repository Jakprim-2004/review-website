"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Mail, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function MagicLinkForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")

    const handleMagicLinkLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) {
            setError("กรุณากรอกอีเมล")
            return
        }

        setIsSubmitting(true)
        setError("")

        try {
            const { data, error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) throw error

            toast({
                title: "ส่งลิงก์เข้าสู่ระบบแล้ว",
                description: "กรุณาตรวจสอบอีเมลของคุณเพื่อเข้าสู่ระบบ",
            })
        } catch (error: any) {
            console.error("Magic link error:", error)
            setError(error.message || "เกิดข้อผิดพลาดในการส่งลิงก์")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleMagicLinkLogin} className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="login-email">อีเมล</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 focus-visible:ring-green-500"
                        required
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                disabled={isSubmitting}
            >
                {isSubmitting ? "กำลังส่งลิงก์..." : "ส่งลิงก์เข้าสู่ระบบ (Magic Link)"}
            </Button>
            <p className="text-xs text-center text-gray-500">
                เราจะส่งลิงก์ไปยังอีเมลของคุณ กดที่ลิงก์เพื่อเข้าสู่ระบบทันทีโดยไม่ต้องใช้รหัสผ่าน
            </p>
        </form>
    )
}
