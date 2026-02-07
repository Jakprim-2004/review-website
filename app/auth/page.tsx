"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import SocialLogin from "@/components/auth/social-login"
import MagicLinkForm from "@/components/auth/magic-link-form"

export default function AuthPage() {
    return (
        <div className="container mx-auto py-10 px-4 min-h-screen flex flex-col items-center justify-center">

            <div className="flex flex-col items-center mb-6">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-full mb-4">
                    <Lock className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    เข้าสู่ระบบ Revio
                </h1>
            </div>

            <Card className="w-full max-w-md border-t-4 border-t-green-500 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-gray-800">ยินดีต้อนรับ</CardTitle>
                    <CardDescription>เลือกวิธีการเข้าสู่ระบบที่สะดวกสำหรับคุณ</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Social Login Section */}
                    <SocialLogin />

                    <div className="relative">
                        <Separator className="my-4" />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                            หรือเข้าสู่ระบบด้วยอีเมล
                        </span>
                    </div>

                    {/* Magic Link Login Form */}
                    <MagicLinkForm />
                </CardContent>
            </Card>

            {/* Info Section */}
            <div className="max-w-md w-full mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-sm font-medium text-green-800 mb-2">🔐 ระบบล็อกอินรูปแบบใหม่</h3>
                <ul className="text-sm text-green-700 space-y-1">
                    <li>• <strong>Social Login</strong> - สะดวกและรวดเร็วที่สุด</li>
                    <li>• <strong>Magic Link</strong> - ปลอดภัย ลืมเรื่องรหัสผ่านไปได้เลย</li>
                </ul>
            </div>
        </div>
    )
}
