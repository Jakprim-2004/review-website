"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { signIn } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Lock, Mail, KeyRound, ArrowLeft, Shield, Sparkles } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminLogin() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      await signIn(formData.email, formData.password)
      toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับเข้าสู่ระบบผู้ดูแล",
      })
      router.push("/admin/dashboard")
    } catch (error) {
      console.error("Login error:", error)

      let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง"

      if (error instanceof Error) {
        if (
          error.message.includes("user-not-found") ||
          error.message.includes("wrong-password") ||
          error.message.includes("invalid-credential") ||
          error.message.includes("Invalid login credentials")
        ) {
          errorMessage = "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง"
        } else if (error.message.includes("too-many-requests")) {
          errorMessage = "มีการพยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ในภายหลัง"
        }
      }

      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemoLogin = () => {
    setIsSubmitting(true)

    setTimeout(() => {
      toast({
        title: "เข้าสู่ระบบโหมดทดลองสำเร็จ",
        description: "คุณกำลังใช้งานในโหมดทดลอง สามารถทดสอบฟังก์ชันต่างๆ ได้",
      })

      if (typeof window !== "undefined") {
        localStorage.setItem("demo_admin_mode", "true")
      }

      router.push("/admin/dashboard")
      setIsSubmitting(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 bg-gradient-to-b from-slate-50 to-white">
      {/* Back Button */}
      <div className="w-full max-w-md mb-6">
        <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับหน้าหลัก
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-4 rounded-2xl mb-4 shadow-lg">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          ระบบผู้ดูแล
        </h1>
        <p className="text-slate-500 mt-2">เข้าสู่ระบบเพื่อจัดการเนื้อหา</p>
      </div>

      {/* Login Card */}
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Lock className="w-4 h-4 mr-2" />
            เข้าสู่ระบบ
          </TabsTrigger>
          <TabsTrigger value="demo" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            โหมดทดลอง
          </TabsTrigger>
        </TabsList>

        {/* Login Tab */}
        <TabsContent value="login">
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-600" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-slate-800">เข้าสู่ระบบ</CardTitle>
              <CardDescription>กรอกข้อมูลเพื่อเข้าสู่ระบบผู้ดูแล</CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4 rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700">อีเมล</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700">รหัสผ่าน</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium shadow-lg transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังเข้าสู่ระบบ...
                    </div>
                  ) : (
                    "เข้าสู่ระบบ"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demo Tab */}
        <TabsContent value="demo">
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                โหมดทดลองใช้งาน
              </CardTitle>
              <CardDescription>ทดลองใช้งานระบบผู้ดูแลโดยไม่ต้องลงทะเบียน</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-medium text-amber-800 mb-2">ฟีเจอร์ที่รองรับในโหมดทดลอง:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>✅ ดูภาพรวม Dashboard</li>
                  <li>✅ จัดการรีวิว (เพิ่ม/ลบ/แก้ไข)</li>
                  <li>✅ ดูสถิติและรายงาน</li>
                  <li>⚠️ ข้อมูลจะไม่ถูกบันทึกจริง</li>
                </ul>
              </div>

              <Button
                onClick={handleDemoLogin}
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium shadow-lg transition-all duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    เข้าสู่โหมดทดลอง
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="w-full max-w-md mt-8 text-center text-sm text-slate-500">
        <p>ต้องการความช่วยเหลือ? ติดต่อผู้ดูแลระบบ</p>
      </div>
    </div>
  )
}
