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

  // Step 1: CV Upload
  const [cvFile, setCVFile] = useState<File | null>(null)
  const [useManualEntry, setUseManualEntry] = useState(false)

  // Step 2: Photo Upload
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  useEffect(() => {
    checkUserStatus()
  }, [])

  const checkUserStatus = async () => {
    try {
      const currentUser = await apiClient.getCurrentUser()
      setUser(currentUser)

      // Vérifier à quelle étape l'utilisateur est
      if (currentUser.cvId && currentUser.photoFilename) {
        // Profil complet, rediriger vers dashboard
        router.push("/dashboard")
      } else if (currentUser.cvId) {
        // CV existe, passer à l'étape photo
        setCurrentStep(2)
      }
    } catch (err) {
      console.error("Erreur lors de la récupération de l'utilisateur:", err)
    }
  }

  const handleCVUpload = async () => {
    if (!cvFile) {
      setError("Veuillez sélectionner un fichier CV")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      await apiClient.uploadCV(cvFile)
      setCurrentStep(2)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.error || "Erreur lors de l'upload du CV")
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
      setError("Veuillez sélectionner une photo")
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
      setError(apiError.error || "Erreur lors de l'upload de la photo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Progress Steps */}
        <div className="border-b border-black pb-6">
          <h1 className="text-3xl font-semibold text-black mb-4">Bienvenue sur Personal B</h1>
          <div className="flex items-center justify-between">
            <div className={`flex-1 text-center ${currentStep >= 1 ? 'text-black font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${currentStep >= 1 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <p className="text-xs">CV</p>
            </div>
            <div className={`flex-1 h-0.5 ${currentStep >= 2 ? 'bg-black' : 'bg-gray-300'}`} />
            <div className={`flex-1 text-center ${currentStep >= 2 ? 'text-black font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${currentStep >= 2 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <p className="text-xs">Photo</p>
            </div>
            <div className={`flex-1 h-0.5 ${currentStep >= 3 ? 'bg-black' : 'bg-gray-300'}`} />
            <div className={`flex-1 text-center ${currentStep >= 3 ? 'text-black font-semibold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${currentStep >= 3 ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'}`}>
                3
              </div>
              <p className="text-xs">Terminé</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {/* Step 1: CV Upload */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-black mb-2">Étape 1 : Votre CV</h2>
              <p className="text-gray-600">
                Pour commencer, nous avons besoin de votre CV. Vous pouvez soit l'uploader, soit remplir les informations manuellement.
              </p>
            </div>

            {!useManualEntry ? (
              <div className="border border-black p-6 space-y-4">
                <h3 className="font-semibold text-black">Option 1 : Uploader votre CV</h3>
                <div className="space-y-2">
                  <Label htmlFor="cv-file">Fichier CV (PDF, DOC, DOCX)</Label>
                  <Input
                    id="cv-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => setCVFile(e.target.files?.[0] || null)}
                    disabled={isLoading}
                  />
                </div>
                <Button onClick={handleCVUpload} disabled={!cvFile || isLoading} className="w-full">
                  {isLoading ? "Upload en cours..." : "Uploader mon CV"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">OU</span>
                  </div>
                </div>

                <Button
                  onClick={() => setUseManualEntry(true)}
                  className="w-full bg-white text-black border border-black hover:bg-gray-100"
                >
                  Remplir manuellement
                </Button>
              </div>
            ) : (
              <div className="border border-black p-6 space-y-4">
                <h3 className="font-semibold text-black">Option 2 : Remplir manuellement</h3>
                <p className="text-gray-600 text-sm">
                  Vous allez être redirigé vers un formulaire pour remplir les informations de votre CV.
                </p>
                <Button onClick={handleManualEntry} className="w-full">
                  Aller au formulaire
                </Button>
                <Button
                  onClick={() => setUseManualEntry(false)}
                  className="w-full bg-white text-black border border-black hover:bg-gray-100"
                >
                  Retour à l'upload
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Photo Upload */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-black mb-2">Étape 2 : Photo de profil</h2>
              <p className="text-gray-600">
                Ajoutez une photo professionnelle qui sera utilisée sur votre CV.
              </p>
            </div>

            <div className="border border-black p-6 space-y-4">
              {photoPreview ? (
                <div className="flex flex-col items-center space-y-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-2 border-black"
                  />
                  <Label htmlFor="photo-file" className="cursor-pointer text-blue-600 hover:underline">
                    Changer la photo
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
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="photo-file">Photo de profil (JPG, PNG, WEBP) - Obligatoire</Label>
                  <Input
                    id="photo-file"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handlePhotoSelect}
                    disabled={isLoading}
                    required
                  />
                  <p className="text-xs text-gray-600">
                    Cette photo sera utilisée sur votre CV professionnel
                  </p>
                </div>
              )}

              <Button onClick={handlePhotoUpload} disabled={!photoFile || isLoading} className="w-full">
                {isLoading ? "Upload en cours..." : "Continuer"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 3 && (
          <div className="border border-black p-8 text-center space-y-4">
            <div className="text-6xl">✓</div>
            <h2 className="text-2xl font-semibold text-black">Configuration terminée !</h2>
            <p className="text-gray-600">
              Votre profil est maintenant configuré. Vous allez être redirigé vers votre dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

