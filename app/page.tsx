"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Search,
  Star,
  MessageCircle,
  Utensils,
  Coffee,
  Smartphone,
  Plane,
  Heart,
  Home,
  X,
  TrendingUp,
  Map
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getReviews } from "@/lib/supabase"

export default function HomePage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด")

  // Mock data for fallback
  const mockReviews = [
    {
      id: "mock-1",
      title: "ร้านอาหารบรรยากาศดีมาก",
      author: "สมชาย",
      date: "2023-04-15",
      content: "อาหารอร่อยมาก บริการดีเยี่ยม บรรยากาศสุดยอด แนะนำให้มาลองครับ!",
      rating: 5,
      commentCount: 3,
      category: "ร้านอาหาร",
    },
    {
      id: "mock-2",
      title: "คาเฟ่ลับย่านอารีย์",
      author: "มีนา",
      date: "2023-04-16",
      content: "กาแฟดี ขนมอร่อย มุมถ่ายรูปเยอะมาก แนะนำให้มาช่วงเช้าคนไม่เยอะ",
      rating: 4,
      commentCount: 12,
      category: "คาเฟ่",
    },
    {
      id: "mock-3",
      title: "ไอโฟน 15 โปรแม็กซ์",
      author: "TechGuy",
      date: "2023-04-18",
      content: "เครื่องลื่นมาก กล้องสวย แต่น้ำหนักเยอะไปหน่อย โดยรวมคุ้มค่า",
      rating: 5,
      commentCount: 45,
      category: "เทคโนโลยี",
    }
  ]

  const categories = [
    { name: "ทั้งหมด", icon: TrendingUp },
    { name: "ร้านอาหาร", icon: Utensils },
    { name: "คาเฟ่", icon: Coffee },
    { name: "เทคโนโลยี", icon: Smartphone },
    { name: "ท่องเที่ยว", icon: Plane },
    { name: "สุขภาพ", icon: Heart },
    { name: "หอพัก", icon: Home },
    { name: "ที่อยู่", icon: Map },
  ]

  useEffect(() => {
    let isMounted = true

    const fetchReviews = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 5000)
        )
        const dataPromise = getReviews(1, 50) // Fetch initial 50 reviews
        const result = await Promise.race([dataPromise, timeoutPromise]) as any

        if (isMounted) {
          if (result && result.data && result.data.length > 0) {
            setReviews(result.data)
          } else {
            setReviews(mockReviews)
          }
        }
      } catch (error) {
        console.error("Error fetching reviews:", error)
        if (isMounted) {
          setReviews(mockReviews)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchReviews()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredReviews = reviews.filter((review) => {
    if (!review) return false
    const matchesSearch =
      (review.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (review.content?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (review.author?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "ทั้งหมด" || review.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pb-16 pt-16">
        <div className="container relative z-10 mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium bg-green-100 text-green-700 border-none">
            แหล่งรวมรีวิวที่จริงใจที่สุด
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6 leading-tight">
            ค้นพบประสบการณ์ <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">ที่ใช่สำหรับคุณ</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 mb-10">
            อ่านรีวิวจากผู้ใช้งานจริง แบ่งปันประสบการณ์ของคุณ
          </p>

          {/* Search Bar */}
          <div className="mx-auto max-w-xl relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="ค้นหารีวิว..."
              className="pl-12 pr-4 h-14 w-full rounded-2xl border-slate-200 shadow-lg text-lg focus-visible:ring-2 focus-visible:ring-green-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <div className="sticky top-[72px] z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 px-2 no-scrollbar">
            {categories.map((category) => {
              const Icon = category.icon
              const isSelected = selectedCategory === category.name
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap border select-none",
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                      : "bg-white text-slate-600 border-slate-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                  )}
                >
                  <Icon size={16} className={isSelected ? "text-green-400" : ""} />
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {selectedCategory === "ทั้งหมด" ? "🔥 รีวิวล่าสุด" : `รีวิวหมวดหมู่ ${selectedCategory}`}
            </h2>
            <p className="text-slate-500 mt-1 text-sm">
              {loading ? "กำลังโหลด..." : `พบ ${filteredReviews.length} รายการ`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl h-80 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredReviews.map((review) => (
              <Link href={`/reviews/${review.id}`} key={review.id} className="group block h-full">
                <Card className="h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100 hover:-translate-y-1">
                  <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="pt-6 pb-2 px-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-normal py-1 px-2.5 rounded-lg">
                        {review.category || "ทั่วไป"}
                      </Badge>
                      <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        {review.rating ? Number(review.rating).toFixed(1) : "0.0"}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 line-clamp-2 group-hover:text-green-600 transition-colors duration-200">
                      {review.title}
                    </h3>
                  </CardHeader>

                  <CardContent className="pb-6 px-6">
                    <p className="text-slate-500 line-clamp-3 text-sm leading-relaxed mb-6">
                      {review.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-green-700">
                          {review.author?.charAt(0) || "U"}
                        </div>
                        <span className="truncate max-w-[80px]">{review.author || "ไม่ระบุชื่อ"}</span>
                      </div>
                      <div className="flex items-center text-slate-400 text-xs gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-full">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {review.comments_count || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">ไม่พบรีวิวที่คุณค้นหา</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูใหม่
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("ทั้งหมด")
              }}
              className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
            >
              ล้างตัวกรองทั้งหมด
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
