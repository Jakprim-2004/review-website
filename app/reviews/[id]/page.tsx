"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Star, MessageSquare, Calendar, Trash2, Send, LogIn, PenTool } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getReview, getComments, addComment, deleteComment, deleteReview, getCurrentUser, onAuthStateChange, isDemoAdmin } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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

interface ReviewData {
  id: string
  title: string
  author: string
  content: string
  rating: number
  category?: string
  date: string
  user_id?: string
}

interface CommentData {
  id: string
  author: string
  content: string
  created_at: string
  user_id?: string
  avatar_url?: string
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [review, setReview] = useState<ReviewData | null>(null)
  const [comments, setComments] = useState<CommentData[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [user, setUser] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // Delete states
  const [deleteType, setDeleteType] = useState<"comment" | "review" | null>(null)
  const [itemIdToDelete, setItemIdToDelete] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // ดึงข้อมูล user ที่ login
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      const demoAdmin = isDemoAdmin()
      if (demoAdmin || currentUser) {
        setIsAdmin(isDemoAdmin())
      }
    }
    checkUser()

    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser)
      setIsAdmin(isDemoAdmin())
    })

    return () => unsubscribe()
  }, [])

  // ดึงข้อมูลรีวิวและ comments จาก database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ดึงข้อมูลรีวิว
        const reviewData = await getReview(id)

        if (reviewData) {
          setReview(reviewData as ReviewData)

          // ดึง comments แยก
          const commentsData = await getComments(id)
          setComments(commentsData as CommentData[])
        } else {
          setReview(null)
        }
      } catch (error) {
        console.error("Error fetching review:", error)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลรีวิวได้",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // ดึงชื่อผู้ใช้จาก user ที่ login
  const getDisplayName = () => {
    if (!user) return ""
    return user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "ผู้ใช้งาน"
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบก่อนแสดงความคิดเห็น",
        variant: "destructive",
      })
      return
    }

    if (!commentText.trim()) {
      toast({
        title: "กรุณากรอกความคิดเห็น",
        description: "กรุณาใส่ความคิดเห็นของคุณ",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const authorName = getDisplayName()
      const result = await addComment(id, {
        author: authorName,
        content: commentText,
        user_id: user.id,
        avatar_url: user.user_metadata?.avatar_url
      })

      if (result.success && result.comment) {
        // เพิ่ม comment ใหม่ใน state
        setComments((prev) => [...prev, result.comment as CommentData])
        setCommentText("")
        toast({
          title: "เพิ่มความคิดเห็นสำเร็จ",
          description: "ความคิดเห็นของคุณถูกเผยแพร่เรียบร้อยแล้ว",
        })
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถเพิ่มความคิดเห็นได้",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDeleteDialog = (type: "comment" | "review", id: string) => {
    setDeleteType(type)
    setItemIdToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!itemIdToDelete || !deleteType) return

    try {
      if (deleteType === "comment") {
        const result = await deleteComment(itemIdToDelete)

        if (result.success) {
          setComments((prev) => prev.filter((comment) => comment.id !== itemIdToDelete))
          toast({
            title: "ลบความคิดเห็นสำเร็จ",
            description: "ความคิดเห็นถูกลบออกจากระบบแล้ว",
          })
        } else {
          throw new Error("Failed to delete comment")
        }
      } else if (deleteType === "review") {
        const result = await deleteReview(itemIdToDelete)

        if (result) {
          toast({
            title: "ลบรีวิวสำเร็จ",
            description: "รีวิวของคุณถูกลบเรียบร้อยแล้ว",
          })
          router.refresh() // Refresh data to update home page
          router.push("/")
        } else {
          throw new Error("Failed to delete review")
        }
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถลบ${deleteType === "comment" ? "ความคิดเห็น" : "รีวิว"}ได้ กรุณาลองใหม่อีกครั้ง`,
        variant: "destructive",
      })
    } finally {
      setItemIdToDelete(null)
      setDeleteType(null)
      setDeleteDialogOpen(false)
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  // Check permissions with Debugging
  const checkPermission = () => {
    if (!review || !user) return false;

    // 1. Admin check
    if (isAdmin) return true;

    // 2. ID Match (Best practice)
    if (review.user_id && review.user_id === user.id) return true;

    // 3. Fallback: Name Match (For legacy posts without user_id)
    const authorName = review.author;
    const userDisplayName = user.user_metadata?.display_name || "";
    const userEmail = user.email || "";

    if (userDisplayName === authorName) return true;
    if (userEmail.startsWith(authorName)) return true;



    return false;
  }

  const canDeleteReview = checkPermission();

  const canDeleteComment = (comment: CommentData) => {
    if (!user) return false;
    if (isAdmin) return true;
    if (comment.user_id === user.id) return true;

    // Fallback for comments
    const userDisplayName = user.user_metadata?.display_name || "";
    if (comment.author === userDisplayName) return true;

    return false;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-4 bg-slate-200 rounded w-32" />
              <div className="bg-white rounded-2xl p-8 shadow-lg space-y-4">
                <div className="h-8 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-32 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-slate-800">ไม่พบรีวิว</h2>
          <p className="text-slate-500 mb-6">รีวิวนี้อาจถูกลบไปแล้วหรือไม่มีอยู่ในระบบ</p>
          <Link href="/">
            <Button className="bg-green-600 hover:bg-green-700 rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center mb-8 text-slate-600 hover:text-slate-900 transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            กลับหน้าหลัก
          </Link>

          {/* Review Card */}
          <Card className="mb-8 border-0 shadow-xl rounded-2xl overflow-hidden relative group">
            <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />

            <CardHeader className="pb-4 pt-6">
              <div className="flex justify-between items-start">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge className="bg-green-100 text-green-700 border-none font-medium">
                    {review.category || "ทั่วไป"}
                  </Badge>
                  <span className="flex items-center text-sm text-slate-500">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {formatDate(review.date)}
                  </span>
                  <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-lg text-sm font-bold">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {review.rating}/5
                  </div>
                </div>

                {/* Review Management Buttons */}
                {canDeleteReview && (
                  <div className="flex gap-2 shrink-0 ml-4">
                    <Link href={`/reviews/${review.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 bg-slate-100 hover:bg-yellow-100 text-slate-500 hover:text-yellow-600 rounded-lg transition-all"
                        title="แก้ไขรีวิว"
                      >
                        <PenTool className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-lg transition-all"
                      onClick={() => openDeleteDialog("review", review.id)}
                      title="ลบุรีวิวนี้"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <CardTitle className="text-2xl md:text-3xl text-slate-800 leading-tight">
                {review.title}
              </CardTitle>
              <div className="flex items-center mt-4 text-slate-500">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center text-green-700 font-medium mr-2">
                  {review.author?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">{review.author}</span>
                  {review.user_id && review.user_id === user?.id && (
                    <span className="text-xs text-green-600">(คุณ)</span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2 pb-8">
              <p className="whitespace-pre-line text-slate-700 leading-relaxed text-lg">
                {review.content}
              </p>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-blue-400 to-purple-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center text-slate-800">
                <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
                ความคิดเห็น ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comment List */}
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-slate-50 rounded-xl p-4 group">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 bg-gradient-to-br from-purple-100 to-blue-100">
                          <AvatarImage src={comment.avatar_url} alt={comment.author} />
                          <AvatarFallback className="text-purple-600 font-medium">
                            {comment.author?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-800">{comment.author}</h4>
                              {comment.user_id && comment.user_id === user?.id && (
                                <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-sm">คุณ</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                {formatDate(comment.created_at)}
                              </span>
                              {canDeleteComment(comment) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => openDeleteDialog("comment", comment.id)}
                                  title="ลบความคิดเห็น"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-slate-600">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl">
                  <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!</p>
                </div>
              )}

              {/* Comment Form */}
              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-lg font-medium mb-4 text-slate-800">แสดงความคิดเห็น</h4>

                {user ? (
                  <form onSubmit={handleCommentSubmit} className="space-y-4">
                    <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-purple-600 text-xs font-medium">
                        {getDisplayName().charAt(0).toUpperCase()}
                      </div>
                      <span>แสดงความคิดเห็นในนาม <span className="font-medium text-purple-600">{getDisplayName()}</span></span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commentText" className="text-slate-700">ความคิดเห็น</Label>
                      <Textarea
                        id="commentText"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="เขียนความคิดเห็นของคุณที่นี่..."
                        rows={4}
                        className="rounded-xl border-slate-200 focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          กำลังส่ง...
                        </div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          ส่งความคิดเห็น
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <LogIn className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 mb-4">กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น</p>
                    <Link href="/auth">
                      <Button className="rounded-xl bg-purple-600 hover:bg-purple-700">
                        <LogIn className="w-4 h-4 mr-2" />
                        เข้าสู่ระบบ
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ{deleteType === "review" ? "รีวิว" : "ความคิดเห็น"}</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{deleteType === "review" ? "รีวิวนี้รวมถึงความคิดเห็นทั้งหมด" : "ความคิดเห็นนี้"}? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setItemIdToDelete(null)
              setDeleteType(null)
            }} className="rounded-xl">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 rounded-xl"
            >
              ลบ{deleteType === "review" ? "รีวิว" : "ความคิดเห็น"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
