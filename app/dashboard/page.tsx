"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * /dashboard — smart redirect based on the user's role stored in the JWT.
 * The /api/auth/me endpoint returns the session including the role.
 * Middleware already guards /dashboard/* so unauthenticated users are
 * redirected to /login before reaching here.
 */
export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.replace("/login")
          return
        }
        const role = data.user.role
        if (role === "provider") {
          router.replace("/dashboard/client")
        } else {
          router.replace("/dashboard/user")
        }
      })
      .catch(() => router.replace("/login"))
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Redirecting to your dashboard…</p>
      </div>
    </div>
  )
}