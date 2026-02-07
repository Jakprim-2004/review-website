"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { getReviews, deleteReview, signOut, onAuthStateChange, isDemoAdmin, isAdmin } from "@/lib/supabase"
import { Trash2, LogOut, ArrowLeft, MessageSquare, Star, Search, Plus, LayoutDashboard, TrendingUp, Users, FileText, Info } from "lucide-react"
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
    const demoMode = isDemoAdmin()
    setIsDemoMode(demoMode)

    if (demoMode) {
      setUser({ email: "demo@example.com", isDemo: true })
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        if (isAdmin(user)) {
          setUser(user)
        } else {
          toast({
            title: "ปฏิเสธการเข้าถึง",
            description: "บัญชีนี้ไม่มีสิทธิ์เข้าถึงหน้า Admin",
            variant: "destructive",
          })
          router.push("/")
        }
      } else {
        router.push("/admin/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user && !isDemoMode) return

      try {
        const result = await getReviews(1, 1000) // Fetch many reviews for admin
        if (result && result.data) {
          setReviews(result.data)
        } else {
          setReviews([])
        }
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
        localStorage.removeItem("demo_admin_mode")
        toast({
          title: "ออกจากโหมดทดลองสำเร็จ",
          description: "คุณได้ออกจากโหมดทดลองแล้ว",
        })
      } else {
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
      review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.content?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Statistics
  const totalReviews = reviews.length
  const totalComments = reviews.reduce((acc, review) => acc + (review.comments?.length || 0), 0)
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, review) => acc + (review.rating || 0), 0) / reviews.length).toFixed(1)
    : "0.0"

  if (!user && !isDemoMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-slate-600">กำลังตรวจสอบสิทธิ์การเข้าถึง...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="rounded-full border-slate-200 hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  ระบบจัดการรีวิว
                </h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge className={`py-1.5 px-3 ${isDemoMode ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-violet-100 text-violet-700 border-violet-200"}`}>
              {isDemoMode ? "🧪 โหมดทดลอง" : user?.email}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 rounded-xl border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
        </div>

        {/* Demo Mode Alert */}
        {isDemoMode && (
          <Alert className="mb-6 bg-amber-50 border-amber-200 rounded-xl">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">คุณกำลังใช้งานในโหมดทดลอง</AlertTitle>
            <AlertDescription className="text-amber-700">
              ในโหมดนี้ คุณสามารถลบได้เฉพาะรีวิวที่เก็บในเครื่องเท่านั้น (มีป้ายกำกับ "เก็บในเครื่อง")
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-400 to-cyan-400" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">รีวิวทั้งหมด</p>
                  <p className="text-3xl font-bold text-slate-800">{totalReviews}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-400" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">ความคิดเห็น</p>
                  <p className="text-3xl font-bold text-slate-800">{totalComments}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-400" />
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">คะแนนเฉลี่ย</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-slate-800">{avgRating}</p>
                    <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหารีวิว..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200 focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <Link href="/write">
            <Button className="h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              เขียนรีวิวใหม่
            </Button>
          </Link>
        </div>

        {/* Review List */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-32 shadow-lg" />
            ))}
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredReviews.map((review) => (
              <Card
                key={review.id}
                className={`border-0 shadow-lg rounded-2xl overflow-hidden hover:shadow-xl transition-shadow ${review.source === "local" ? "ring-2 ring-amber-200" : ""}`}
              >
                <div className={`h-1 ${review.source === "local" ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-violet-400 to-purple-400"}`} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <CardTitle className="text-lg text-slate-800">{review.title}</CardTitle>
                        <Badge className="bg-slate-100 text-slate-600 border-none font-normal">
                          {review.category || "ทั่วไป"}
                        </Badge>
                        {review.source === "local" && (
                          <Badge className="bg-amber-100 text-amber-700 border-none">
                            เก็บในเครื่อง
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2 text-slate-500">
                        โดย {review.author} • {review.date}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(review.id)}
                      className={`rounded-full hover:bg-red-100 hover:text-red-600 ${isDemoMode && !review.id.startsWith("local_") ? "opacity-40 cursor-not-allowed" : ""}`}
                      disabled={isDemoMode && !review.id.startsWith("local_")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-1 mb-3">
                    {Array(5).fill(0).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}
                      />
                    ))}
                    <span className="text-sm text-slate-500 ml-1">{review.rating}/5</span>
                  </div>
                  <p className="line-clamp-2 text-slate-600 text-sm">{review.content}</p>
                </CardContent>
                <CardFooter className="border-t border-slate-50 bg-slate-50/50 py-3">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center text-sm text-slate-500">
                      <MessageSquare className="h-4 w-4 mr-1.5" />
                      {review.comments?.length || 0} ความคิดเห็น
                    </div>
                    <Link href={`/reviews/${review.id}`}>
                      <Button variant="ghost" size="sm" className="rounded-lg hover:bg-violet-100 hover:text-violet-700">
                        ดูรายละเอียด →
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-4">{searchTerm ? "ไม่พบรีวิวที่ตรงกับคำค้นหา" : "ไม่พบรีวิว"}</p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm("")}
                className="rounded-xl"
              >
                ล้างการค้นหา
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรีวิว</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600 rounded-xl">
              ลบรีวิว
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
