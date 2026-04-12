"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Users,
  Clock,
  Phone,
  Mail,
  TrendingUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bot,
  LogOut,
  RefreshCw,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { GoogleCalendarIntegration } from "@/components/google-calendar-integration"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Booking {
  _id: string
  user_id: string
  user_email: string
  service_name: string
  provider_id: string
  date: string
  time: string
  duration_minutes: number
  status: "confirmed" | "pending" | "cancelled" | "completed"
  notes?: string
  google_event_id_user?: string
  created_at: string
}

interface CalendarDay {
  date: Date
  bookings: Booking[]
  isToday: boolean
  isCurrentMonth: boolean
}

interface UserProfile {
  name: string
  email: string
  role: string
  userId: string
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: Booking["status"] }) {
  switch (status) {
    case "confirmed": return <CheckCircle className="h-4 w-4 text-green-500" />
    case "pending": return <AlertCircle className="h-4 w-4 text-yellow-500" />
    case "cancelled": return <XCircle className="h-4 w-4 text-red-500" />
    case "completed": return <CheckCircle className="h-4 w-4 text-blue-500" />
  }
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const variants: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    completed: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${variants[status] || ""}`}>
      {status}
    </span>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function ClientDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<"day" | "week" | "month">("week")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

  // Fetch user profile
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user)
        else router.push("/login")
      })
      .catch(() => router.push("/login"))
  }, [router])

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setIsLoadingBookings(true)
    try {
      const res = await fetch("/api/bookings")
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err)
    } finally {
      setIsLoadingBookings(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchBookings()
  }, [user, fetchBookings])

  // Generate calendar days
  useEffect(() => {
    const days: CalendarDay[] = []
    const today = new Date()
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const startOfWeek = new Date(startOfMonth)
    startOfWeek.setDate(startOfMonth.getDate() - startOfMonth.getDay())

    for (let i = 0; i < 42; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]

      const dayBookings = bookings.filter((b) => b.date === dateStr)

      days.push({
        date,
        bookings: dayBookings,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
      })
    }
    setCalendarDays(days)
  }, [currentDate, bookings])

  const navigateMonth = (dir: "prev" | "next") => {
    const d = new Date(currentDate)
    d.setMonth(currentDate.getMonth() + (dir === "next" ? 1 : -1))
    setCurrentDate(d)
  }

  // Stats
  const today = new Date().toISOString().split("T")[0]
  const todayBookings = bookings.filter((b) => b.date === today)
  const upcomingBookings = bookings.filter((b) => b.date > today).slice(0, 5)
  const stats = {
    total: bookings.length,
    today: todayBookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur"
      >
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ScheduleAI</span>
          </Link>

          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              <Bot className="h-3 w-3 mr-1" />
              Provider Dashboard
            </Badge>
            {user && (
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:block">{user.name}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto p-4 max-w-7xl">
        {/* Stats Row */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {[
            { label: "Total Bookings", value: stats.total, icon: CalendarDays, color: "text-primary" },
            { label: "Today", value: stats.today, icon: Clock, color: "text-orange-500" },
            { label: "Pending", value: stats.pending, icon: AlertCircle, color: "text-yellow-500" },
            { label: "Completed", value: stats.completed, icon: TrendingUp, color: "text-green-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold">
                      {isLoadingBookings ? <Loader2 className="h-5 w-5 animate-spin" /> : value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Booking Calendar
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={selectedView} onValueChange={(v: "day" | "week" | "month") => setSelectedView(v)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={fetchBookings} disabled={isLoadingBookings}>
                      <RefreshCw className={`h-4 w-4 ${isLoadingBookings ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-semibold text-sm min-w-[140px] text-center">
                    {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => navigateMonth("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {selectedView === "month" && (
                  <div className="grid grid-cols-7 gap-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">
                        {d}
                      </div>
                    ))}
                    {calendarDays.map((day, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.005 }}
                        className={`min-h-[70px] p-1.5 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          day.isToday ? "bg-primary/10 border-primary" : "border-transparent"
                        } ${!day.isCurrentMonth ? "opacity-40" : ""}`}
                      >
                        <div className="text-xs font-medium mb-1">{day.date.getDate()}</div>
                        <div className="space-y-0.5">
                          {day.bookings.slice(0, 2).map((b) => (
                            <div
                              key={b._id}
                              className="text-[10px] p-0.5 rounded bg-primary/20 text-primary font-medium truncate cursor-pointer"
                              onClick={() => setSelectedBooking(b)}
                            >
                              {b.time} {b.service_name}
                            </div>
                          ))}
                          {day.bookings.length > 2 && (
                            <div className="text-[10px] text-muted-foreground">+{day.bookings.length - 2}</div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {selectedView === "week" && (
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.slice(0, 7).map((day, i) => (
                      <motion.div
                        key={i}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-3 border rounded-lg ${day.isToday ? "bg-primary/10 border-primary" : ""}`}
                      >
                        <div className="text-center mb-2">
                          <div className="text-xs text-muted-foreground">
                            {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                          </div>
                          <div className={`text-base font-bold ${day.isToday ? "text-primary" : ""}`}>
                            {day.date.getDate()}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {day.bookings.map((b) => (
                            <div
                              key={b._id}
                              className="text-[10px] p-1.5 rounded bg-primary/20 text-primary cursor-pointer hover:bg-primary/30 transition-colors"
                              onClick={() => setSelectedBooking(b)}
                            >
                              <div className="font-semibold">{b.time}</div>
                              <div className="truncate">{b.service_name}</div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {selectedView === "day" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-center text-muted-foreground">
                      {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </h3>
                    {todayBookings.length > 0 ? (
                      todayBookings.map((b) => (
                        <motion.div
                          key={b._id}
                          whileHover={{ scale: 1.01 }}
                          className="p-4 border rounded-xl cursor-pointer hover:shadow-sm transition-all"
                          onClick={() => setSelectedBooking(b)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{b.service_name}</div>
                              <div className="text-sm text-muted-foreground">{b.user_email}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{b.time}</div>
                              <StatusBadge status={b.status} />
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No bookings today</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <GoogleCalendarIntegration
              userType="client"
              onEventSync={(events) => {
                console.log("[Provider Dashboard] Calendar synced:", events.length, "events")
              }}
            />

            {/* Upcoming bookings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Upcoming Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-56">
                  {isLoadingBookings ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : upcomingBookings.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingBookings.map((b) => (
                        <motion.div
                          key={b._id}
                          whileHover={{ scale: 1.01 }}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedBooking(b)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold">
                              {new Date(b.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {b.time}
                            </span>
                            <StatusIcon status={b.status} />
                          </div>
                          <div className="text-sm font-medium">{b.service_name}</div>
                          <div className="text-xs text-muted-foreground">{b.user_email}</div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No upcoming bookings</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Booking Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-xl shadow-2xl max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Booking Details</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)} className="rounded-full h-7 w-7 p-0">
                    ×
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="font-medium">{selectedBooking.service_name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <StatusIcon status={selectedBooking.status} />
                      <StatusBadge status={selectedBooking.status} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Date</p>
                      <p className="font-medium">{new Date(selectedBooking.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Time</p>
                      <p className="font-medium">{selectedBooking.time}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Duration</p>
                      <p className="font-medium">{selectedBooking.duration_minutes} min</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Calendar</p>
                      <p className="font-medium text-xs">
                        {selectedBooking.google_event_id_user ? "✅ Synced" : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{selectedBooking.user_email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
