"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient, ApiError, User } from "@/lib/api"

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const [cvFile, setCVFile] = useState<File | null>(null)
  const [useManualEntry, setUseManualEntry] = useState(false)

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      const currentUser = await apiClient.getCurrentUser()
      setUser(currentUser)

      if (currentUser.cvId && currentUser.photoFilename) {
        router.push("/dashboard")
      } else if (currentUser.cvId) {
        setCurrentStep(2)
      }
    } catch (err) {
      console.error("Error fetching user:", err)
    }
  }

  const handleCVUpload = async () => {
    if (!cvFile) {
      setError("Please select a CV file")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      await apiClient.uploadCV(cvFile)
      setCurrentStep(2)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.error || "Error uploading CV")
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualEntry = () => {
    router.push("/cv/manual?onboarding=true")
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      setError("Please select a photo")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      await apiClient.uploadPhoto(photoFile)
      setCurrentStep(3)
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.error || "Error uploading photo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 relative" style={{ backgroundImage: 'linear-gradient(rgba(229, 231, 235, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(229, 231, 235, 0.6) 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <img 
              src="/logo.png" 
              alt="Personal B Logo" 
              className="w-28 h-28 mx-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-black mb-2">Welcome</h1>
          <p className="text-gray-600">Set up your profile in 3 simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-md mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-elegant shadow-elegant ${
                currentStep >= 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <p className={`text-xs mt-2 font-medium ${currentStep >= 1 ? 'text-black' : 'text-gray-400'}`}>
                CV
              </p>
            </div>

            {/* Connector */}
            <div className={`h-1 flex-1 mx-4 rounded-full transition-elegant ${
              currentStep >= 2 ? 'bg-black' : 'bg-gray-200'
            }`} />

            {/* Step 2 */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-elegant shadow-elegant ${
                currentStep >= 2 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <p className={`text-xs mt-2 font-medium ${currentStep >= 2 ? 'text-black' : 'text-gray-400'}`}>
                Photo
              </p>
            </div>

            {/* Connector */}
            <div className={`h-1 flex-1 mx-4 rounded-full transition-elegant ${
              currentStep >= 3 ? 'bg-black' : 'bg-gray-200'
            }`} />

            {/* Step 3 */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-elegant shadow-elegant ${
                currentStep >= 3 ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep >= 3 ? '✓' : '3'}
              </div>
              <p className={`text-xs mt-2 font-medium ${currentStep >= 3 ? 'text-black' : 'text-gray-400'}`}>
                Done
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl shadow-elegant">
            {error}
          </div>
        )}

        {/* Step 1: CV Upload */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">Your CV</h2>
                <p className="text-gray-600">
                  To get started, we need your CV. Choose your preferred method.
                </p>
              </div>

              {!useManualEntry ? (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-black transition-elegant">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <Label htmlFor="cv-file" className="text-lg font-medium text-black cursor-pointer hover:underline">
                          Click to upload your CV
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX (max 10MB)</p>
                      </div>
                      <Input
                        id="cv-file"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => setCVFile(e.target.files?.[0] || null)}
                        disabled={isLoading}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {cvFile && (
                    <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-black">{cvFile.name}</p>
                          <p className="text-xs text-gray-500">{(cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCVFile(null)}
                        className="text-gray-400 hover:text-red-500 transition-elegant"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}

                  <Button 
                    onClick={handleCVUpload} 
                    disabled={!cvFile || isLoading}
                    className="w-full h-12 rounded-xl bg-black hover:bg-gray-800 transition-elegant shadow-elegant"
                  >
                    {isLoading ? "Uploading..." : "Continue with this CV"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">or</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setUseManualEntry(true)}
                    className="w-full h-12 rounded-xl bg-white text-black border-2 border-black hover:bg-gray-50 transition-elegant"
                  >
                    Fill manually
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black mb-2">Manual Form</h3>
                    <p className="text-gray-600">
                      You will be redirected to a form to fill in your CV information.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button onClick={handleManualEntry} className="w-full h-12 rounded-xl bg-black hover:bg-gray-800 transition-elegant shadow-elegant">
                      Go to form
                    </Button>
                    <Button
                      onClick={() => setUseManualEntry(false)}
                      className="w-full h-12 rounded-xl bg-white text-black border-2 border-gray-300 hover:border-black transition-elegant"
                    >
                      ← Back to upload
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Photo Upload */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black mb-2">Profile Photo</h2>
                <p className="text-gray-600">
                  Add a professional photo that will be used on your CV.
                </p>
              </div>

              <div className="space-y-6">
                {photoPreview ? (
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-40 h-40 rounded-full object-cover border-4 border-black shadow-elegant-lg"
                      />
                      <div className="absolute bottom-0 right-0 w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-elegant cursor-pointer hover:bg-gray-800 transition-elegant">
                        <Label htmlFor="photo-file" className="cursor-pointer flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </Label>
                        <Input
                          id="photo-file"
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          onChange={handlePhotoSelect}
                          disabled={isLoading}
                          className="hidden"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">Click the icon to change</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 hover:border-black transition-elegant">
                    <div className="text-center space-y-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <Label htmlFor="photo-file" className="text-lg font-medium text-black cursor-pointer hover:underline">
                          Add a profile photo
                        </Label>
                        <p className="text-sm text-gray-500 mt-1">JPG, PNG, WEBP (max 5MB) - Required</p>
                      </div>
                      <Input
                        id="photo-file"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={handlePhotoSelect}
                        disabled={isLoading}
                        required
                        className="hidden"
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handlePhotoUpload} 
                  disabled={!photoFile || isLoading}
                  className="w-full h-12 rounded-xl bg-black hover:bg-gray-800 transition-elegant shadow-elegant"
                >
                  {isLoading ? "Uploading..." : "Complete Setup"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl shadow-elegant-lg p-12 border border-gray-100 text-center">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto shadow-elegant-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-black mb-2">Setup Complete!</h2>
                <p className="text-gray-600">
                  Your profile is now configured. Redirecting to your dashboard...
                </p>
              </div>
              <div className="flex justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-black rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
