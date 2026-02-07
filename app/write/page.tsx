"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { addReview, getCurrentUser, onAuthStateChange } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Star, ArrowLeft, PenTool, Send, LogIn } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateReview() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLocalStorage, setIsLocalStorage] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        rating: "5",
        category: "ทั่วไป",
    })

    // ดึงข้อมูล user ที่ login
    useEffect(() => {
        const checkUser = async () => {
            const currentUser = await getCurrentUser()
            setUser(currentUser)
            setLoading(false)
        }
        checkUser()

        const unsubscribe = onAuthStateChange((currentUser) => {
            setUser(currentUser)
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

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

        if (!user) {
            toast({
                title: "กรุณาเข้าสู่ระบบ",
                description: "คุณต้องเข้าสู่ระบบก่อนจึงจะเขียนรีวิวได้",
                variant: "destructive",
            })
            router.push("/auth")
            return
        }

        setIsSubmitting(true)

        try {
            // ดึงชื่อผู้ใช้จาก user ที่ login
            const authorName = user.user_metadata?.display_name || user.email?.split("@")[0] || "ผู้ใช้งาน"

            const result = await addReview({
                ...formData,
                author: authorName,
                user_id: user.id,
                rating: Number.parseInt(formData.rating),
                date: new Date().toISOString().split("T")[0],
            })

            if (result.source === "local") {
                setIsLocalStorage(true)
                toast({
                    title: "บันทึกรีวิวในเครื่องแล้ว",
                    description: "รีวิวของคุณถูกบันทึกในเครื่องเนื่องจากปัญหาการเชื่อมต่อ",
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
                    errorMessage = "ไม่มีสิทธิ์เข้าถึง กรุณาตรวจสอบการตั้งค่าฐานข้อมูล"
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
        { value: "ทั่วไป", emoji: "📝" },
        { value: "ร้านอาหาร", emoji: "🍜" },
        { value: "คาเฟ่", emoji: "☕" },
        { value: "เทคโนโลยี", emoji: "💻" },
        { value: "ท่องเที่ยว", emoji: "✈️" },
        { value: "สุขภาพ", emoji: "❤️" },
        { value: "หอพัก", emoji: "🏠" },
        { value: "ที่อยู่", emoji: "📍" },
        { value: "ความงาม", emoji: "💄" },
        { value: "แฟชั่น", emoji: "👗" },
        { value: "บันเทิง", emoji: "🎬" },
        { value: "การศึกษา", emoji: "📚" },
        { value: "อื่นๆ", emoji: "📌" },
    ]

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
            </div>
        )
    }

    // ถ้ายังไม่ได้ login
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
                <div className="max-w-md mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 text-slate-400 mb-6">
                        <LogIn className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-3">กรุณาเข้าสู่ระบบ</h1>
                    <p className="text-slate-500 mb-6">คุณต้องเข้าสู่ระบบก่อนจึงจะเขียนรีวิวได้</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/auth">
                            <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 rounded-xl h-11">
                                <LogIn className="w-4 h-4 mr-2" />
                                เข้าสู่ระบบ
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline" className="w-full sm:w-auto rounded-xl h-11">
                                กลับหน้าหลัก
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "ผู้ใช้งาน"

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <Link
                    href="/"
                    className="inline-flex items-center mb-8 text-slate-600 hover:text-slate-900 transition-colors group"
                >
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    กลับหน้าหลัก
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white mb-4 shadow-lg">
                        <PenTool className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                        เขียนรีวิวใหม่
                    </h1>
                    <p className="text-slate-500">
                        โพสต์ในนาม <span className="font-medium text-green-600">{displayName}</span>
                    </p>
                </div>

                {/* Warning Alert */}
                {isLocalStorage && (
                    <Alert className="mb-6 border-amber-200 bg-amber-50 rounded-xl">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">ปัญหาการเชื่อมต่อ</AlertTitle>
                        <AlertDescription className="text-amber-700">
                            รีวิวของคุณจะถูกบันทึกในเครื่องแทนที่จะบันทึกในฐานข้อมูล
                        </AlertDescription>
                    </Alert>
                )}

                {/* Form Card */}
                <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />
                    <form onSubmit={handleSubmit}>
                        <CardHeader className="pb-4 pt-6">
                            <CardTitle className="text-lg text-slate-800">กรอกข้อมูลรีวิว</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-slate-700 font-medium">
                                    หัวข้อรีวิว <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="เช่น รีวิวร้านกาแฟบรรยากาศดี ย่านสยาม"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-slate-700 font-medium">
                                    หมวดหมู่
                                </Label>
                                <Select value={formData.category} onValueChange={handleCategoryChange}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-green-500">
                                        <SelectValue placeholder="เลือกหมวดหมู่" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {categories.map((category) => (
                                            <SelectItem key={category.value} value={category.value} className="rounded-lg">
                                                <span className="flex items-center gap-2">
                                                    <span>{category.emoji}</span>
                                                    <span>{category.value}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Rating */}
                            <div className="space-y-3">
                                <Label className="text-slate-700 font-medium">
                                    คะแนน <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((rating) => (
                                            <button
                                                key={rating}
                                                type="button"
                                                onClick={() => handleRatingChange(rating)}
                                                className="p-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg hover:bg-yellow-50 transition-colors"
                                                aria-label={`${rating} ดาว`}
                                            >
                                                <Star
                                                    className={`transition-all duration-200 ${Number.parseInt(formData.rating) >= rating
                                                        ? "fill-yellow-400 text-yellow-400 scale-110"
                                                        : "text-slate-300 hover:text-yellow-300"
                                                        }`}
                                                    size={32}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-lg font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                                        {formData.rating}/5
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-2">
                                <Label htmlFor="content" className="text-slate-700 font-medium">
                                    เนื้อหารีวิว <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="content"
                                    name="content"
                                    placeholder="เขียนรีวิวของคุณที่นี่... บอกเล่าประสบการณ์ สิ่งที่ชอบ และข้อเสนอแนะ"
                                    value={formData.content}
                                    onChange={handleChange}
                                    rows={8}
                                    className="rounded-xl border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                    required
                                />
                                <p className="text-sm text-slate-400">
                                    {formData.content.length} ตัวอักษร
                                </p>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 border-t border-slate-100 bg-slate-50/50 py-4 px-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/")}
                                className="w-full sm:w-auto rounded-xl border-slate-200 hover:bg-slate-100"
                            >
                                ยกเลิก
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full sm:w-auto h-11 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        กำลังบันทึก...
                                    </div>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        เผยแพร่รีวิว
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Tips */}
                <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                    <h3 className="text-sm font-medium text-green-800 mb-2">💡 เคล็ดลับการเขียนรีวิวที่ดี</h3>
                    <ul className="text-sm text-green-700 space-y-1">
                        <li>• บอกเล่าประสบการณ์จริงที่เกิดขึ้น</li>
                        <li>• ระบุข้อดีและข้อเสียอย่างเที่ยงธรรม</li>
                        <li>• ให้รายละเอียดที่เป็นประโยชน์ต่อผู้อื่น</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
