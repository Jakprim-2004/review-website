"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut } from "lucide-react"
import { getCurrentUser, onAuthStateChange, signOut } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function AuthButton() {
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        // Check initial user
        getCurrentUser().then(setUser)

        // Subscribe to auth changes
        const unsubscribe = onAuthStateChange((currentUser) => {
            setUser(currentUser)
        })

        return () => unsubscribe() // This assumes onAuthStateChange returns an unsubscribe function directly, or we handle it inside
    }, [])

    const handleSignOut = async () => {
        await signOut()
        setUser(null)
        router.push("/")
    }

    if (user) {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
            >
                <LogOut className="h-4 w-4 mr-2" />
                ออกจากระบบ
            </Button>
        )
    }

    return (
        <Link href="/auth">
            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <LogIn className="h-4 w-4 mr-2" />
                เข้าสู่ระบบ
            </Button>
        </Link>
    )
}
