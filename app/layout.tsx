import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import AdminLink from "@/components/admin-link"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ReviewHub - แชร์ประสบการณ์ดีๆ",
  description: "แพลตฟอร์มสำหรับแบ่งปันและพูดคุยเกี่ยวกับรีวิว",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={cn(inter.className, "bg-gradient-to-b from-blue-50 to-white")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <main className="min-h-screen">
            <header className="bg-white shadow-sm sticky top-0 z-10">
              <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-2 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-message-square-heart"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <path d="M14.8 8.5a1.8 1.8 0 1 0-3.6 0c0 .5.2 1 .5 1.4l2.3 2.6 2.3-2.6c.3-.4.5-.9.5-1.4a1.8 1.8 0 0 0-2-1.8Z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ReviewCSC Hub
                  </h1>
                </Link>
                <div className="flex items-center gap-4">
                  {/* คงปุ่มเขียนรีวิวใหม่ไว้ แต่เปลี่ยน URL เป็นรูปแบบที่คาดเดายาก */}
                  <Link href="/thai-review-website-X6zs2vzKiPR">
                    <button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2">
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
                    </button>
                  </Link>
                  <Link href="/chat">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-message-square"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      แชท
                    </Button>
                  </Link>
                  <AdminLink />
                </div>
              </div>
            </header>
            {children}
            <footer className="bg-white border-t mt-12 py-8">
              <div className="container mx-auto px-4 text-center">
                <p className="text-gray-600">© 2023 ReviewHub - แพลตฟอร์มแชร์ประสบการณ์และรีวิว</p>
              </div>
            </footer>
          </main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
