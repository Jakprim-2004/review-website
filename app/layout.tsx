import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { cn } from "@/lib/utils"
import UserNav from "@/components/user-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Revio - แชร์ประสบการณ์ดีๆ ให้ทุกคนได้รู้",
  description: "แพลตฟอร์มรีวิวและแชทเรียลไทม์สำหรับนักศึกษา รองรับการเขียนรีวิว ให้คะแนน และพูดคุยในห้องแชท",
  generator: 'v0.dev',
  keywords: ['รีวิว', 'review', 'หอพัก', 'ร้านอาหาร', 'คาเฟ่', 'นักศึกษา'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={cn(inter.className, "bg-gradient-to-b from-green-50 to-white min-h-screen")} suppressHydrationWarning={true}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="flex flex-col min-h-screen">
            <header className="bg-white shadow-sm sticky top-0 z-10">
              <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-2 rounded-lg">
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
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Revio
                  </h1>
                </Link>
                <UserNav />
              </div>
            </header>

            <main className="flex-1">
              {children}
            </main>

            <footer className="bg-white border-t mt-auto py-8">
              <div className="container mx-auto px-4 text-center">
                <p className="text-gray-600">© 2026 Revio - แพลตฟอร์มรีวิวและแชทเรียลไทม์</p>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
