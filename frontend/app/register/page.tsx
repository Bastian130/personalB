"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient, ApiError } from "@/lib/api"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await apiClient.register(email, password, name)
      console.log("Registration successful:", response.user)
      // Rediriger vers l'onboarding pour les nouveaux utilisateurs
      router.push("/onboarding")
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.error || "An error occurred during registration")
      console.error("Registration error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative" style={{ backgroundImage: 'linear-gradient(rgba(229, 231, 235, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(229, 231, 235, 0.6) 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="Personal B Logo"
            className="w-64 h-64 mx-auto"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100 relative" style={{ boxShadow: '0 0 80px rgba(251, 191, 36, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-black">Create Account</h2>
              <p className="text-sm text-gray-500">Join us in seconds</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-elegant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-elegant"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-elegant"
                />
                <p className="text-xs text-gray-500">Minimum 6 characters</p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-black hover:bg-gray-800 transition-elegant text-base font-medium shadow-elegant" 
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link href="/login" className="font-medium text-black hover:underline transition-elegant">
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          By creating an account, you agree to our terms of service
        </p>
      </div>
    </div>
  )
}
