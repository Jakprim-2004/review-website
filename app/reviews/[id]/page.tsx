"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Star, MessageSquare, Calendar, User, Trash2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getReview, addComment, deleteComment, getCurrentUser, onAuthStateChange, isDemoAdmin } from "@/lib/firebase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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

export default function ReviewPage({ params }: { params: { id: string } }) {
  const [review, setReview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [commentAuthor, setCommentAuthor] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLocalReview, setIsLocalReview] = useState(false)
  const [hasLocalComments, setHasLocalComments] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  useEffect(() => {
    // ตรวจสอบว่าเป็นแอดมินหรือไม่
    const checkAdmin = () => {
      const demoAdmin = isDemoAdmin()
      const currentUser = getCurrentUser()

      if (demoAdmin || currentUser) {
        setIsAdmin(true)
      }
    }

    checkAdmin()

    const unsubscribe = onAuthStateChange((user) => {
      setIsAdmin(!!user || isDemoAdmin())
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchReview = async () => {
      try {
        // Check if it's a local review
        setIsLocalReview(params.id.startsWith("local_"))

        // In a real app, this would fetch from Firebase
        const reviewData = await getReview(params.id)

        if (reviewData) {
          setReview(reviewData)
          setHasLocalComments(!!reviewData.hasLocalComments)
        } else {
          // Fallback data if review not found
          setReview({
            id: params.id,
            title: "ไม่พบรีวิว",
            author: "ไม่ทราบ",
            date: new Date().toISOString().split("T")[0],
            content: "ไม่พบรีวิวนี้ อาจถูกลบไปแล้วหรือมีข้อผิดพลาดในการโหลดข้อมูล",
            rating: 0,
            comments: [],
          })
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

    fetchReview()
  }, [params.id])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!commentText.trim() || !commentAuthor.trim()) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "กรุณาใส่ชื่อและความคิดเห็นของคุณ",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // In a real app, this would save to Firebase
      const newComment = {
        id: `c${Date.now()}`,
        author: commentAuthor,
        date: new Date().toISOString().split("T")[0],
        text: commentText,
      }

      const result = await addComment(params.id, newComment)

      // Update local state
      setReview((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
      }))

      setCommentText("")
      setCommentAuthor("")

      if (result.source === "local") {
        setHasLocalComments(true)
        toast({
          title: "ความคิดเห็นถูกบันทึกในเครื่อง",
          description: "ความคิดเห็นของคุณถูกบันทึกในเครื่องเนื่องจากปัญหาการเชื่อมต่อกับ ฐานข้อมูล",
        })
      } else {
        toast({
          title: "เพิ่มความคิดเห็นสำเร็จ",
          description: "ความคิดเห็นของคุณถูกเผยแพร่เรียบร้อยแล้ว",
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

  const handleDeleteComment = async () => {
    if (!commentToDelete || !review) {
      return
    }

    try {
      const result = await deleteComment(review.id, commentToDelete)

      if (result.success) {
        // Update local state
        setReview((prev) => ({
          ...prev,
          comments: prev.comments.filter((comment) => comment.id !== commentToDelete),
        }))

        toast({
          title: "ลบความคิดเห็นสำเร็จ",
          description: "ความคิดเห็นถูกลบออกจากระบบแล้ว",
        })
      } else {
        // กรณีที่ลบไม่สำเร็จ
        toast({
          title: "เกิดข้อผิดพลาด",
          description: result.error || "ไม่สามารถลบความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive",
        })
      }
    } catch (error) {
      // กรณีที่เกิด exception
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบความคิดเห็นได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setCommentToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-12"></div>
          <div className="h-32 bg-gray-200 rounded w-full max-w-3xl mb-8"></div>
          <div className="h-24 bg-gray-200 rounded w-full max-w-3xl"></div>
        </div>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">ไม่พบรีวิว</h2>
        <Link href="/">
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <ArrowLeft className="mr-2 h-4 w-4" />
            กลับไปหน้าหลัก
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Link href="/" className="inline-flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        กลับไปหน้าหลัก
      </Link>

      {isLocalReview && (
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>รีวิวที่เก็บในเครื่อง</AlertTitle>
          <AlertDescription>
            รีวิวนี้ถูกเก็บในเครื่องของคุณเนื่องจากปัญหาการเชื่อมต่อกับ Firebase รีวิวนี้จะแสดงเฉพาะบนอุปกรณ์นี้เท่านั้น
          </AlertDescription>
        </Alert>
      )}

      {hasLocalComments && !isLocalReview && (
        <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>มีความคิดเห็นที่เก็บในเครื่อง</AlertTitle>
          <AlertDescription>
            บางความคิดเห็นถูกเก็บในเครื่องของคุณเนื่องจากปัญหาการเชื่อมต่อกับ Firebase ความคิดเห็นเหล่านี้จะแสดงเฉพาะบนอุปกรณ์นี้เท่านั้น
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-8 border-t-4 border-t-blue-500 shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
              {review.category || "ทั่วไป"}
            </span>
            <span className="text-gray-500 text-sm">•</span>
            <span className="flex items-center text-sm text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              {review.date}
            </span>
          </div>
          <CardTitle className="text-3xl text-gray-800">{review.title}</CardTitle>
          <CardDescription className="flex items-center mt-2">
            <User className="h-4 w-4 mr-1" />
            โดย {review.author}
          </CardDescription>
          <div className="flex mt-3">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                />
              ))}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="whitespace-pre-line text-gray-700 leading-relaxed">{review.content}</p>
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg shadow-lg border-t-4 border-t-purple-500 overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
            <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
            ความคิดเห็น ({review.comments?.length || 0})
          </h3>

          {review.comments?.length > 0 ? (
            <div className="space-y-4">
              {review.comments.map((comment: any) => (
                <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 bg-purple-100">
                      <AvatarFallback className="text-purple-500">
                        {comment.author.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-medium text-gray-800">{comment.author}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{comment.date}</span>

                          {/* ปุ่มลบความคิดเห็น (แสดงเฉพาะแอดมิน) */}
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600"
                              onClick={() => {
                                setCommentToDelete(comment.id)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">ยังไม่มีความคิดเห็น เป็นคนแรกที่แสดงความคิดเห็น!</p>
            </div>
          )}

          <Separator className="my-6" />

          <div>
            <h4 className="text-lg font-medium mb-4 text-gray-800">แสดงความคิดเห็น</h4>
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="commentAuthor" className="text-gray-700">
                  ชื่อของคุณ
                </Label>
                <Input
                  id="commentAuthor"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder="ใส่ชื่อของคุณ"
                  className="focus-visible:ring-purple-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commentText" className="text-gray-700">
                  ความคิดเห็น
                </Label>
                <Textarea
                  id="commentText"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="เขียนความคิดเห็นของคุณที่นี่..."
                  rows={4}
                  className="focus-visible:ring-purple-500"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                {isSubmitting ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
              </Button>
            </form>
          </div>
        </div>
      </div>
      {/* Dialog ยืนยันการลบความคิดเห็น */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบความคิดเห็น</AlertDialogTitle>
            <AlertDialogDescription>คุณแน่ใจหรือไม่ว่าต้องการลบความคิดเห็นนี้? การกระทำนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCommentToDelete(null)}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteComment} className="bg-red-500 hover:bg-red-600">
              ลบความคิดเห็น
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
