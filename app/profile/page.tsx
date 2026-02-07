"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { getCurrentUser, supabase, getReviews, uploadAvatar } from "@/lib/supabase"
import { LogIn, User, Save, MessageSquare, Star, Calendar, ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    // Form State
    const [displayName, setDisplayName] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")

    // Reviews State
    const [myReviews, setMyReviews] = useState<any[]>([])
    const [loadingReviews, setLoadingReviews] = useState(true)

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
            router.push("/auth")
            return
        }

        setUser(currentUser)
        setDisplayName(currentUser.user_metadata?.display_name || currentUser.user_metadata?.full_name || "")
        setAvatarUrl(currentUser.user_metadata?.avatar_url || "")

        // Load User's Reviews
        fetchMyReviews(currentUser.id)
        setLoading(false)
    }

    const fetchMyReviews = async (userId: string) => {
        try {
            // Note: This fetches ALL reviews and filters client-side. 
            // Optimized query would be: .eq('user_id', userId) in Supabase call but getReviews is generic.
            // For now we'll use getReviews for consistency or query directly.
            const { data, error } = await supabase
                .from('reviews')
                .select('*, comments(count)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (data) {
                const reviewsWithCount = data.map((item: any) => ({
                    ...item,
                    comments_count: item.comments ? item.comments[0]?.count : 0
                }))
                setMyReviews(reviewsWithCount)
            }
        } catch (error) {
            console.error("Error fetching user reviews:", error)
        } finally {
            setLoadingReviews(false)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        setUploading(true)
        const file = e.target.files[0]

        try {
            const publicUrl = await uploadAvatar(file)
            if (publicUrl) {
                setAvatarUrl(publicUrl)
                toast({
                    title: "อัปโหลดรูปภาพสำเร็จ",
                    description: "กรุณากดบันทึกเพื่อยืนยันการเปลี่ยนแปลง",
                })
            } else {
                throw new Error("Upload failed")
            }
        } catch (error) {
            console.error("Error uploading avatar:", error)
            toast({
                title: "อัปโหลดไม่สำเร็จ",
                description: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
                variant: "destructive"
            })
        } finally {
            setUploading(false)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    display_name: displayName,
                    avatar_url: avatarUrl
                }
            })

            if (error) throw error

            toast({
                title: "อัปเดตโปรไฟล์สำเร็จ",
                description: "ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว",
            })

            // Update local user state
            setUser(data.user)
            router.refresh()

        } catch (error) {
            console.error("Error updating profile:", error)
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถอัปเดตข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString("th-TH", {
                year: "numeric",
                month: "short",
                day: "numeric",
            })
        } catch {
            return dateString
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
            <div className="container mx-auto max-w-4xl">

                <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    กลับหน้าหลัก
                </Link>
                <h1 className="text-3xl font-bold text-slate-900 mb-8">โปรไฟล์ของฉัน</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Left Column: Profile Edit */}
                    <div className="md:col-span-1 space-y-6">
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl">แก้ไขข้อมูลส่วนตัว</CardTitle>
                                <CardDescription>จัดการชื่อและรูปภาพโปรไฟล์ของคุณ</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUpdateProfile} className="space-y-6">

                                    {/* Avatar Preview */}
                                    <div className="flex flex-col items-center gap-4">
                                        <Avatar className="h-24 w-24 border-4 border-white shadow-md ring-2 ring-slate-100">
                                            <AvatarImage src={avatarUrl} objectFit="cover" />
                                            <AvatarFallback className="text-2xl bg-slate-100 text-slate-400">
                                                {displayName ? displayName.charAt(0).toUpperCase() : <User />}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="displayName">ชื่อที่ใช้แสดง</Label>
                                            <Input
                                                id="displayName"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                placeholder="ชื่อของคุณ"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="avatarFile">รูปโปรไฟล์</Label>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id="avatarFile"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    disabled={uploading}
                                                    className="cursor-pointer file:cursor-pointer file:text-blue-600 file:font-semibold file:bg-blue-50 file:rounded-md file:border-0 file:mr-4 file:py-1 file:px-2 hover:file:bg-blue-100"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                รองรับไฟล์รูปภาพเท่านั้น (JPG, PNG, GIF)
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="avatarUrl">หรือใช้ลิงก์รูปภาพ (URL)</Label>
                                            <Input
                                                id="avatarUrl"
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                placeholder="https://example.com/image.jpg"
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={saving}>
                                        {saving ? "กำลังบันทึก..." : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                บันทึกการเปลี่ยนแปลง
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm">
                            <p className="font-medium mb-1">Tip:</p>
                            <p>คุณสามารถใช้ URL รูปภาพจาก Discord, Google Drive (Direct Link), หรือเว็บฝากรูปต่างๆ ได้</p>
                        </div>
                    </div>

                    {/* Right Column: My Reviews */}
                    <div className="md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-900">รีวิวของฉัน ({myReviews.length})</h2>
                            <Link href="/write">
                                <Button variant="outline" size="sm">+ เขียนรีวิวใหม่</Button>
                            </Link>
                        </div>

                        {loadingReviews ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />)}
                            </div>
                        ) : myReviews.length > 0 ? (
                            <div className="space-y-4">
                                {myReviews.map((review) => (
                                    <Link href={`/reviews/${review.id}`} key={review.id} className="block group">
                                        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ring-1 ring-slate-100">
                                            <CardContent className="p-5">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex gap-2 items-center mb-1">
                                                        <Badge variant="secondary" className="font-normal text-xs">{review.category || "ทั่วไป"}</Badge>
                                                        <span className="text-xs text-slate-400">{formatDate(review.date || review.created_at)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-yellow-500 font-bold text-sm bg-yellow-50 px-2 py-0.5 rounded-md">
                                                        <Star className="w-3 h-3 fill-yellow-500" />
                                                        {review.rating}
                                                    </div>
                                                </div>

                                                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{review.title}</h3>
                                                <p className="text-slate-500 text-sm line-clamp-2 mb-3">{review.content}</p>

                                                <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-2">
                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <MessageSquare className="w-3.5 h-3.5" />
                                                            {review.comments_count || 0} ความคิดเห็น
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-1">คุณยังไม่ได้เขียนรีวิว</h3>
                                <p className="text-slate-500 mb-4">เริ่มเขียนรีวิวแรกของคุณเลย!</p>
                                <Link href="/write">
                                    <Button>เขียนรีวิว</Button>
                                </Link>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}
