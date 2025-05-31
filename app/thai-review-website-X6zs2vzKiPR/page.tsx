"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { addReview } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Star, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateReview() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLocalStorage, setIsLocalStorage] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    rating: "5",
    author: "",
    category: "ทั่วไป",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRatingChange = (value: number) => {
    setFormData((prev) => ({ ...prev, rating: value.toString() }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await addReview({
        ...formData,
        rating: Number.parseInt(formData.rating),
        date: new Date().toISOString().split("T")[0],
        commentCount: 0,
      })

      if (result.source === "local") {
        setIsLocalStorage(true)
        toast({
          title: "บันทึกรีวิวในเครื่องแล้ว",
          description: "รีวิวของคุณถูกบันทึกในเครื่องเนื่องจากปัญหาการเชื่อมต่อกับ Firebase",
        })
      } else {
        toast({
          title: "สร้างรีวิวสำเร็จ",
          description: "รีวิวของคุณถูกเผยแพร่เรียบร้อยแล้ว",
        })
      }

      router.push("/")
    } catch (error) {
      console.error("Error creating review:", error)

      let errorMessage = "เกิดปัญหาในการสร้างรีวิว กรุณาลองใหม่อีกครั้ง"

      if (error instanceof Error) {
        if (error.message.includes("permission") || error.message.includes("insufficient")) {
          errorMessage = "ไม่มีสิทธิ์เข้าถึง กรุณาตรวจสอบกฎความปลอดภัยของ Firebase"
        }
      }

      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const categories = [
    "ทั่วไป",
    "ร้านอาหาร",
    "คาเฟ่",
    "เทคโนโลยี",
    "ท่องเที่ยว",
    "สุขภาพ",
    "หอพัก",
    "ที่อยู่",
    "ความงาม",
    "แฟชั่น",
    "บันเทิง",
    "การศึกษา",
    "อื่นๆ",
  ]

  return (
    <div className="container mx-auto py-10 px-4">
      <Link href="/" className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับไปหน้าหลัก
      </Link>

      <Card className="max-w-2xl mx-auto border-t-4 border-t-blue-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="text-2xl text-gray-800">เขียนรีวิวใหม่</CardTitle>
          <CardDescription>แบ่งปันประสบการณ์ของคุณให้กับผู้อื่น</CardDescription>
        </CardHeader>

        {isLocalStorage && (
          <div className="px-6 pt-4">
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>ปัญหาการเชื่อมต่อกับ Firebase</AlertTitle>
              <AlertDescription>รีวิวของคุณจะถูกบันทึกในเครื่องแทนที่จะบันทึกใน Firebase</AlertDescription>
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700">
                หัวข้อรีวิว
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="ใส่หัวข้อรีวิวของคุณ"
                value={formData.title}
                onChange={handleChange}
                className="focus-visible:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author" className="text-gray-700">
                  ชื่อผู้เขียน
                </Label>
                <Input
                  id="author"
                  name="author"
                  placeholder="ใส่ชื่อของคุณ"
                  value={formData.author}
                  onChange={handleChange}
                  className="focus-visible:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-gray-700">
                  หมวดหมู่
                </Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="focus:ring-blue-500">
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">คะแนน</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingChange(rating)}
                    className="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                    aria-label={`${rating} ดาว`}
                  >
                    <Star
                      className={
                        Number.parseInt(formData.rating) >= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }
                      size={28}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-gray-700">
                เนื้อหารีวิว
              </Label>
              <Textarea
                id="content"
                name="content"
                placeholder="เขียนรีวิวของคุณที่นี่..."
                value={formData.content}
                onChange={handleChange}
                rows={8}
                className="focus-visible:ring-blue-500"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-gray-50 py-4">
            <Button type="button" variant="outline" onClick={() => router.push("/")}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isSubmitting ? "กำลังบันทึก..." : "เผยแพร่รีวิว"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
