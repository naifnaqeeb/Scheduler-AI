"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Bot, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Role = "user" | "provider"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = (searchParams.get("role") as Role) || "user"

  const [role, setRole] = useState<Role>(defaultRole)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const serviceCategories = [
    "Beauty & Hair", "Healthcare", "Wellness & Spa", "Fitness", 
    "Dental", "Legal", "Consulting", "Education", "Home Services", "Other"
  ]

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, businessName, category, location }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
        return
      }

      router.push(role === "provider" ? "/dashboard/client" : "/dashboard/user")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Link href="/" className="flex items-center space-x-2 justify-center mb-8 group">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <span className="text-2xl font-bold">ScheduleAI</span>
        </Link>

        <Card className="shadow-2xl border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create account</CardTitle>
            <CardDescription className="text-center">Join the AI booking platform</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Role Toggle */}
            <div className="grid grid-cols-2 gap-3">
              {(["user", "provider"] as Role[]).map((r) => (
                <motion.button
                  key={r}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setRole(r)}
                  className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all font-medium text-sm ${
                    role === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  {r === "user" ? <Users className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  {r === "user" ? "I'm a Customer" : "I'm a Business"}
                </motion.button>
              ))}
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder={role === "provider" ? "Owner / Contact Name" : "Full Name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <AnimatePresence>
                {role === "provider" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        placeholder="Downtown Salon, City Dental, etc."
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Select...</option>
                          {serviceCategories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="City, Area"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 border border-destructive/20"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </motion.div>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={`/login?type=${role}`}
                className="text-primary font-medium hover:underline"
              >
                Sign in
              </Link>
            </div>

            <div className="flex items-center justify-center">
              <Link
                href="/"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
