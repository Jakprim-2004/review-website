"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Star, Search, X } from "lucide-react"
import { getReviews } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const [reviews, setReviews] = useState<any[]>([])
  const [hasLocalReviews, setHasLocalReviews] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด")

  // Categories for filtering
  const categories = [
    { name: "ทั้งหมด", icon: "layers" },
    { name: "ร้านอาหาร", icon: "utensils" },
    { name: "คาเฟ่", icon: "coffee" },
    { name: "เทคโนโลยี", icon: "smartphone" },
    { name: "ท่องเที่ยว", icon: "map" },
    { name: "สุขภาพ", icon: "heart" },
    { name: "หอพัก", icon: "home" },
    { name: "ที่อยู่", icon: "map-pin" },
  ]

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsData = await getReviews()
        setReviews(reviewsData)
        setHasLocalReviews(reviewsData.some((review) => review.source === "local"))
      } catch (error) {
        console.error("Error fetching reviews:", error)
        setError("ไม่สามารถโหลดข้อมูลรีวิวได้")

        // ใช้ข้อมูลตัวอย่างเมื่อเกิดข้อผิดพลาด
        setReviews([
          {
            id: "1",
            title: "ร้านอาหารบรรยากาศดีมาก",
            author: "สมชาย",
            date: "2023-04-15",
            content: "อาหารอร่อยมาก บริการดีเยี่ยม บรรยากาศสุดยอด แนะนำให้มาลองครับ!",
            rating: 5,
            commentCount: 3,
            category: "ร้านอาหาร",
          },
          {
            id: "2",
            title: "รีวิวสมาร์ทโฟนรุ่นใหม่",
            author: "สมหญิง",
            date: "2023-04-10",
            content: "แบตเตอรี่ใช้งานได้นาน แต่กล้องยังไม่ค่อยดีเท่าที่ควร โดยรวมคุ้มค่ากับราคา",
            rating: 4,
            commentCount: 7,
            category: "เทคโนโลยี",
          },
          {
            id: "3",
            title: "ร้านกาแฟน่านั่งมาก",
            author: "มานี",
            date: "2023-04-05",
            content: "บรรยากาศอบอุ่น กาแฟรสชาติดี ขนมอบสดใหม่อร่อยมาก!",
            rating: 5,
            commentCount: 2,
            category: "คาเฟ่",
          },
          {
            id: "4",
            title: "หอพักใกล้มหาวิทยาลัย สะดวกสบาย",
            author: "วิชัย",
            date: "2023-05-20",
            content: "หอพักสะอาด มีรปภ. 24 ชม. ใกล้ร้านสะดวกซื้อและร้านอาหาร เดินทางสะดวก แนะนำสำหรับนักศึกษา",
            rating: 4,
            commentCount: 5,
            category: "หอพัก",
          },
          {
            id: "5",
            title: "คอนโดใจกลางเมือง วิวสวย",
            author: "นภา",
            date: "2023-06-10",
            content: "ทำเลดีมาก ใกล้ BTS เดินทางสะดวก มีสิ่งอำนวยความสะดวกครบครัน สระว่ายน้ำวิวสวย",
            rating: 5,
            commentCount: 8,
            category: "ที่อยู่",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  // กรองรีวิวตามคำค้นหาและหมวดหมู่
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.author.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "ทั้งหมด" || review.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // การค้นหาทำงานแบบ real-time จึงไม่จำเป็นต้องมีโค้ดเพิ่มเติมที่นี่
  }

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
  }

  const clearSearch = () => {
    setSearchTerm("")
  }

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">แชร์ประสบการณ์ดีๆ ให้ทุกคนได้รู้</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">ค้นพบรีวิวที่น่าสนใจ หรือแบ่งปันประสบการณ์ของคุณให้กับผู้อื่น</p>
          <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
            <Input
              type="text"
              placeholder="ค้นหารีวิว..."
              className="pl-10 py-6 rounded-full shadow-lg border-0 focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-3 text-gray-400" />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                aria-label="ล้างการค้นหา"
              >
                <X size={18} />
              </button>
            )}
          </form>
        </div>
      </section>

      <div className="container mx-auto py-10 px-4">
        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => handleCategorySelect(category.name)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all",
                category.name === selectedCategory
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-md"
                  : "bg-white hover:bg-gray-100 text-gray-700 border shadow-sm",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {hasLocalReviews && (
          <Alert variant="warning" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>บางรีวิวถูกเก็บไว้ในเครื่องของคุณ</AlertTitle>
            <AlertDescription>
              เนื่องจากปัญหาการเชื่อมต่อกับ Firebase บางรีวิวจึงถูกเก็บไว้ในเครื่องของคุณ รีวิวเหล่านี้จะแสดงเฉพาะบนอุปกรณ์นี้เท่านั้น
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedCategory === "ทั้งหมด" ? "รีวิวล่าสุด" : `รีวิว${selectedCategory}`}
          </h2>

          {(searchTerm || selectedCategory !== "ทั้งหมด") && (
            <div className="flex items-center gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  ค้นหา: {searchTerm}
                  <button onClick={clearSearch} className="ml-1 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </Badge>
              )}

              {selectedCategory !== "ทั้งหมด" && (
                <Badge variant="secondary" className="gap-1 px-3 py-1">
                  หมวดหมู่: {selectedCategory}
                  <button onClick={() => setSelectedCategory("ทั้งหมด")} className="ml-1 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((review) => (
              <Link
                href={`/reviews/${review.id}`}
                key={review.id}
                className="transform transition-all hover:scale-[1.02]"
              >
                <Card
                  className={cn(
                    "h-full overflow-hidden hover:shadow-lg transition-shadow border-t-4",
                    review.source === "local" ? "border-t-amber-400" : "border-t-blue-500",
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-gray-800">{review.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                            {review.category || "ทั่วไป"}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">โดย {review.author}</span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex mb-2">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                          />
                        ))}
                    </div>
                    <p className="line-clamp-3 text-gray-600">{review.content}</p>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center text-sm text-gray-500">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {review.comments?.length || review.commentCount || 0} ความคิดเห็น
                      </div>
                      <div className="text-sm text-gray-500">{review.date}</div>
                      {review.source === "local" && (
                        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">เก็บในเครื่อง</span>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <Search className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory !== "ทั้งหมด"
                  ? "ไม่พบรีวิวที่ตรงกับเงื่อนไขการค้นหา"
                  : "ยังไม่มีรีวิว เริ่มเขียนรีวิวแรกกันเลย!"}
              </p>
              {searchTerm || selectedCategory !== "ทั้งหมด" ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedCategory("ทั้งหมด")
                    }}
                  >
                    ล้างการค้นหา
                  </Button>
                  {/* ใช้ URL ที่คาดเดายาก */}
                  <Link href="/thai-review-website-X6zs2vzKiPR">
                    <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      เขียนรีวิวใหม่
                    </Button>
                  </Link>
                </div>
              ) : (
                <Link href="/thai-review-website-X6zs2vzKiPR">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    เขียนรีวิวใหม่
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
