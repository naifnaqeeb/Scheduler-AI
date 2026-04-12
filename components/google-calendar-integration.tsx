"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Calendar,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  WifiOff,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

// Shape returned by the Python backend /calendar/events endpoint
interface BackendCalendarEvent {
  id: string
  summary: string
  time: string        // e.g. "02:30 PM"
  location?: string
  html_link?: string
}

interface GoogleCalendarIntegrationProps {
  userType: "user" | "client"
  onEventSync?: (events: BackendCalendarEvent[]) => void
}

type SyncStatus = "idle" | "syncing" | "success" | "error" | "unconfigured"

// ─── Component ────────────────────────────────────────────────────────────────

export function GoogleCalendarIntegration({
  userType,
  onEventSync,
}: GoogleCalendarIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [events, setEvents] = useState<BackendCalendarEvent[]>([])
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // ─── Fetch real events from backend ──────────────────────────────────────

  const fetchEvents = useCallback(
    async (day?: string) => {
      setIsLoading(true)
      setSyncStatus("syncing")
      setErrorMessage(null)

      try {
        const url = day
          ? `/api/calendar/events?day=${encodeURIComponent(day)}`
          : `/api/calendar/events`

        const res = await fetch(url)
        const data = await res.json()

        if (data.error) {
          // Backend couldn't reach Google Calendar (not configured or token expired)
          setIsConnected(false)
          setSyncStatus("unconfigured")
          setErrorMessage(data.error)
          setEvents([])
        } else {
          const fetchedEvents: BackendCalendarEvent[] = data.events || []
          setEvents(fetchedEvents)
          setIsConnected(true)
          setSyncStatus("success")
          setLastSync(new Date())
          onEventSync?.(fetchedEvents)
        }
      } catch {
        setSyncStatus("error")
        setErrorMessage("Could not reach the calendar backend.")
        setIsConnected(false)
        setEvents([])
      } finally {
        setIsLoading(false)
        // Auto-reset status badge after 3 s
        setTimeout(() => setSyncStatus((prev) => (prev !== "unconfigured" ? "idle" : prev)), 3000)
      }
    },
    [onEventSync]
  )

  // Initial load — fetch today's events
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleSync = () => {
    if (isLoading) return
    fetchEvents()
  }

  const handleConnect = () => {
    // For now: attempt to fetch events — if Google Calendar is configured on
    // the backend, this will work. Otherwise it degrades gracefully.
    fetchEvents()
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setEvents([])
    setLastSync(null)
    setSyncStatus("idle")
    setErrorMessage(null)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const statusBadgeVariant =
    syncStatus === "success"
      ? "default"
      : syncStatus === "error" || syncStatus === "unconfigured"
      ? "destructive"
      : "secondary"

  const statusLabel =
    syncStatus === "syncing"
      ? "Syncing..."
      : syncStatus === "success"
      ? "Synced"
      : syncStatus === "error"
      ? "Error"
      : syncStatus === "unconfigured"
      ? "Not configured"
      : null

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: isLoading ? 360 : 0 }}
              transition={{
                duration: 1,
                repeat: isLoading ? Infinity : 0,
                ease: "linear",
              }}
            >
              <Calendar className="h-5 w-5" />
            </motion.div>
            Google Calendar
            {isConnected && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Badge variant="secondary" className="ml-1 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {events.length} events
                </Badge>
              </motion.div>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {isConnected && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  id="calendar-sync-btn"
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isLoading}
                >
                  <motion.div
                    animate={{ rotate: isLoading ? 360 : 0 }}
                    transition={{
                      duration: 1,
                      repeat: isLoading ? Infinity : 0,
                      ease: "linear",
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                  </motion.div>
                  Sync
                </Button>
              </motion.div>
            )}

            <AnimatePresence>
              {syncStatus !== "idle" && statusLabel && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <Badge
                    variant={statusBadgeVariant}
                    className={syncStatus === "syncing" ? "animate-pulse" : ""}
                  >
                    {statusLabel}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {lastSync && (
          <motion.p
            className="text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Last synced:{" "}
            {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </motion.p>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ── Not connected / not configured ── */}
          {!isConnected ? (
            <motion.div
              key="disconnected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8 space-y-4"
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {syncStatus === "unconfigured" ? (
                  <WifiOff className="h-14 w-14 mx-auto text-muted-foreground/40" />
                ) : (
                  <Calendar className="h-14 w-14 mx-auto text-muted-foreground/40" />
                )}
              </motion.div>

              <div>
                <h3 className="font-semibold mb-1">
                  {syncStatus === "unconfigured"
                    ? "Calendar Not Configured"
                    : "Connect Google Calendar"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                  {syncStatus === "unconfigured"
                    ? "The backend Google Calendar token is missing or expired. Add credentials.json + run auth on the server."
                    : userType === "user"
                    ? "Sync your confirmed bookings to your Google Calendar automatically."
                    : "Connect your business calendar to view all appointments in one place."}
                </p>
                {errorMessage && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-4 border border-destructive/20">
                    {errorMessage}
                  </p>
                )}
              </div>

              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  id="calendar-connect-btn"
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full max-w-xs"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      {syncStatus === "unconfigured" ? "Retry Connection" : "Connect Google Calendar"}
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            /* ── Connected — show real events ── */
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3 h-full flex flex-col"
            >
              {/* Header row */}
              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </motion.div>
                  <span className="text-sm font-medium">Today&apos;s Events</span>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-xs text-muted-foreground"
                  >
                    Disconnect
                  </Button>
                </motion.div>
              </motion.div>

              {/* Event list */}
              <ScrollArea className="flex-1 h-64">
                <AnimatePresence>
                  {events.length > 0 ? (
                    <div className="space-y-2 pr-2">
                      {events.map((event, index) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          transition={{
                            delay: index * 0.06,
                            type: "spring",
                            stiffness: 300,
                            damping: 28,
                          }}
                          whileHover={{ scale: 1.015, boxShadow: "0 2px 10px rgba(0,0,0,0.07)" }}
                          className="p-3 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                <h4 className="font-medium text-sm truncate">{event.summary}</h4>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span>{event.time}</span>
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {event.html_link && (
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                                  <a
                                    href={event.html_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Open in Google Calendar"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      className="text-center py-10 text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No events today</p>
                      <p className="text-xs mt-1 opacity-60">
                        Bookings you confirm will appear here
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ScrollArea>

              {/* Footer note */}
              <motion.div
                className="pt-2 border-t"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-xs text-muted-foreground text-center">
                  {userType === "user"
                    ? "Confirmed bookings are added to your Google Calendar automatically"
                    : "All customer bookings are synced to your business Google Calendar"}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
