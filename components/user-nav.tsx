"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentUser, onAuthStateChange, signOut, isDemoAdmin, isAdmin as checkIsAdmin } from "@/lib/supabase"
import { LogOut, User, MessageSquare, PenTool, ShieldAlert, LogIn } from "lucide-react"

export default function UserNav() {
    const [user, setUser] = useState<any>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Check initial user
        const checkUser = async () => {
            const currentUser = await getCurrentUser()
            setUser(currentUser)
            setIsAdmin(checkIsAdmin(currentUser))
        }
        checkUser()

        const unsubscribe = onAuthStateChange((currentUser) => {
            setUser(currentUser)
            setIsAdmin(checkIsAdmin(currentUser))
        })

        return () => unsubscribe()
    }, [])

    // Prevent hydration mismatch
    if (!mounted) return null

    const handleSignOut = async () => {
        await signOut()
        if (typeof window !== "undefined") {
            localStorage.removeItem("demo_admin_mode")
        }
        setUser(null)
        setIsAdmin(false)
        router.push("/")
        router.refresh()
    }

    // Not logged in state
    if (!user && !isDemoAdmin()) {
        return (
            <Link href="/auth">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <LogIn className="w-4 h-4 mr-2" />
                    เข้าสู่ระบบ
                </Button>
            </Link>
        )
    }

    // Logged in state
    const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "ผู้ใช้งาน"
    const userEmail = user?.email || ""
    // รองรับ avatar จากหลาย source: Google, GitHub, หรือ custom
    const avatarUrl = user?.user_metadata?.avatar_url ||
        user?.user_metadata?.picture || // Google uses 'picture'
        user?.user_metadata?.avatar || // Some providers
        ""
    const userInitial = displayName.charAt(0).toUpperCase()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-green-100 ring-offset-2 hover:ring-green-200 transition-all">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-green-100 to-emerald-200 text-green-700 font-medium">
                            {userInitial}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-green-100 to-emerald-200 text-green-700 font-medium text-lg">
                                {userInitial}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1 flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground truncate">
                                {userEmail}
                            </p>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push("/chat")}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>แชท</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/write")}>
                        <PenTool className="mr-2 h-4 w-4" />
                        <span>เขียนรีวิว</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                        <User className="mr-2 h-4 w-4" />
                        <span>โปรไฟล์ของฉัน</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                {(isDemoAdmin() || isAdmin) && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/admin/dashboard")}>
                            <ShieldAlert className="mr-2 h-4 w-4 text-green-600" />
                            <span className="text-green-600">จัดการรีวิว (Admin)</span>
                        </DropdownMenuItem>
                    </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ออกจากระบบ</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
