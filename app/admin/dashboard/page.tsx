"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { getReviews, deleteReview, signOut, onAuthStateChange, isDemoAdmin } from "@/lib/firebase"
import { Trash2, LogOut, ArrowLeft, MessageSquare, Star, Search } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // ตรวจสอบว่าอยู่ในโหมดทดลองหรือไม่
    const demoMode = isDemoAdmin()
    setIsDemoMode(demoMode)

    if (demoMode) {
      setUser({ email: "demo@example.com", isDemo: true })
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setUser(user)
      } else {
        // Redirect to login if not authenticated
        router.push("/admin/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user && !isDemoMode) return

      try {
        const reviewsData = await getReviews()
        setReviews(reviewsData)
      } catch (error) {
        console.error("Error fetching reviews:", error)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลรีวิวได้",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [user, isDemoMode])

  const handleSignOut = async () => {
    try {
      if (isDemoMode) {
        // ถ้าอยู่ในโหมดทดลอง ให้ลบข้อมูลจาก localStorage
        localStorage.removeItem("demo_admin_mode")
        toast({
          title: "ออกจากโหมดทดลองสำเร็จ",
          description: "คุณได้ออกจากโหมดทดลองแล้ว",
        })
      } else {
        // ถ้าเป็นผู้ใช้จริง ให้ออกจากระบบผ่าน Firebase
        await signOut()
        toast({
          title: "ออกจากระบบสำเร็จ",
          description: "คุณได้ออกจากระบบแล้ว",
        })
      }
      router.push("/admin/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (id: string) => {
    setReviewToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return

    try {
      // ในโหมดทดลอง อนุญาตให้ลบได้เฉพาะรีวิวที่เก็บในเครื่อง
      if (isDemoMode && !reviewToDelete.startsWith("local_")) {
        toast({
          title: "ไม่สามารถลบได้",
          description: "ในโหมดทดลอง คุณสามารถลบได้เฉพาะรีวิวที่เก็บในเครื่องเท่านั้น",
          variant: "destructive",
        })
        setDeleteDialogOpen(false)
        setReviewToDelete(null)
        return
      }

      await deleteReview(reviewToDelete)
      setReviews(reviews.filter((review) => review.id !== reviewToDelete))
      toast({
        title: "ลบรีวิวสำเร็จ",
        description: "รีวิวถูกลบออกจากระบบแล้ว",
      })
    } catch (error) {
      console.error("Error deleting review:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบรีวิวได้",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setReviewToDelete(null)
    }
  }

  const filteredReviews = reviews.filter(
    (review) =>
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.content.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!user && !isDemoMode) {
    return (
      <div className="container mx-auto py-10 text-center">
        <p>กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ระบบจัดการรีวิว
          </h1>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="ค้นหารีวิว..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/thai-review-website-X6zs2vzKiPR">
              <Button variant="outline" size="sm" className="gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-plus"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                เขียนรีวิวใหม่
              </Button>
            </Link>
            <Badge
              variant="outline"
              className={`${isDemoMode ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"} hover:bg-blue-50`}
            >
              {isDemoMode ? "โหมดทดลอง" : user.email}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </div>

      {isDemoMode && (
        <Alert className="mb-6 bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">คุณกำลังใช้งานในโหมดทดลอง</AlertTitle>
          <AlertDescription className="text-amber-700">
            ในโหมดนี้ คุณสามารถลบได้เฉพาะรีวิวที่เก็บในเครื่องเท่านั้น (มีป้ายกำกับ "เก็บในเครื่อง")
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            </div>
          ))}
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredReviews.map((review) => (
            <Card
              key={review.id}
              className={`border-l-4 ${review.source === "local" ? "border-l-amber-400" : "border-l-blue-500"} hover:shadow-lg transition-shadow`}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-xl">{review.title}</CardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {review.category || "ทั่วไป"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      โดย {review.author} เมื่อ {review.date}
                    </CardDescription>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteClick(review.id)}
                    className={`rounded-full hover:scale-105 transition-transform ${isDemoMode && !review.id.startsWith("local_") ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={isDemoMode && !review.id.startsWith("local_")}
                    title={
                      isDemoMode && !review.id.startsWith("local_")
                        ? "ในโหมดทดลอง สามารถลบได้เฉพาะรีวิวที่เก็บในเครื่องเท่านั้น"
                        : "ลบรีวิว"
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex mb-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                      />
                    ))}
                </div>
                <p className="line-clamp-2 text-gray-600 mb-4">{review.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {review.comments?.length || review.commentCount || 0} ความคิดเห็น
                  </div>
                  {review.source === "local" && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">
                      เก็บในเครื่อง
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t bg-gray-50">
                <Link href={`/reviews/${review.id}`}>
                  <Button variant="outline" className="hover:bg-blue-50 hover:text-blue-600 transition-colors">
                    ดูรายละเอียด
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 p-3 rounded-full mb-4">
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-gray-600 mb-4">{searchTerm ? "ไม่พบรีวิวที่ตรงกับคำค้นหา" : "ไม่พบรีวิว"}</p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                className="hover:bg-blue-50 hover:text-blue-600"
              >
                ล้างการค้นหา
              </Button>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรีวิว</AlertDialogTitle>
            <AlertDialogDescription>คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              ลบรีวิว
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
