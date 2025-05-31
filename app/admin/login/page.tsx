"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { signIn } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Lock, User, Info } from "lucide-react"
import Link from "next/link"
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
          error.message.includes("invalid-credential")
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

    // จำลองการเข้าสู่ระบบสำหรับโหมดทดลองใช้งาน
    setTimeout(() => {
      toast({
        title: "เข้าสู่ระบบโหมดทดลองสำเร็จ",
        description: "คุณกำลังใช้งานในโหมดทดลอง สามารถทดสอบฟังก์ชันต่างๆ ได้",
      })

      // เก็บสถานะการเข้าสู่ระบบในโหมดทดลองไว้ใน localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("demo_admin_mode", "true")
      }

      router.push("/admin/dashboard")
      setIsSubmitting(false)
    }, 1500)
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Link href="/" className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors">
        <Button variant="ghost" className="pl-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          กลับไปหน้าหลัก
        </Button>
      </Link>

      <div className="flex flex-col items-center justify-center">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-full mb-4">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          เข้าสู่ระบบผู้ดูแล
        </h1>
      </div>

      <Tabs defaultValue="login" className="max-w-md mx-auto">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">เข้าสู่ระบบ</TabsTrigger>
          <TabsTrigger value="demo">โหมดทดลอง</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Card className="border-t-4 border-t-purple-500 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">เข้าสู่ระบบ</CardTitle>
              <CardDescription>กรอกข้อมูลเพื่อเข้าสู่ระบบผู้ดูแล</CardDescription>
            </CardHeader>

            {error && (
              <div className="px-6">
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">
                    อีเมล
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 focus-visible:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">
                    รหัสผ่าน
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 focus-visible:ring-purple-500"
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="demo">
          <Card className="border-t-4 border-t-blue-500 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800">โหมดทดลองใช้งาน</CardTitle>
              <CardDescription>ทดลองใช้งานระบบผู้ดูแลโดยไม่ต้องลงทะเบียน</CardDescription>
            </CardHeader>

            <CardContent>
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>สำหรับการทดลองใช้งาน</AlertTitle>
                <AlertDescription>
                  โหมดนี้ใช้สำหรับทดลองใช้งานระบบผู้ดูแลเท่านั้น ไม่จำเป็นต้องมีบัญชีผู้ใช้จริง ข้อมูลจะถูกเก็บในเครื่องของคุณเท่านั้น
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">ในโหมดทดลองใช้งาน คุณสามารถ:</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>ดูรีวิวทั้งหมดในระบบ</li>
                  <li>ลบรีวิวที่เก็บในเครื่องของคุณ</li>
                  <li>ทดลองใช้งานฟังก์ชันต่างๆ ของระบบผู้ดูแล</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                onClick={handleDemoLogin}
                className="w-full bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่โหมดทดลองใช้งาน"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="max-w-md mx-auto mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">วิธีตั้งค่าบัญชีผู้ดูแล</h3>
        <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1">
          <li>ไปที่ Firebase Console ของคุณ</li>
          <li>เลือกโปรเจค "reviwe-38148"</li>
          <li>ไปที่ "Authentication" และเปิดใช้งานการยืนยันตัวตนด้วยอีเมล/รหัสผ่าน</li>
          <li>เพิ่มผู้ใช้ใหม่ด้วยอีเมลและรหัสผ่านที่ต้องการ</li>
          <li>ใช้ข้อมูลนี้เพื่อเข้าสู่ระบบผู้ดูแล</li>
        </ol>
      </div>
    </div>
  )
}
