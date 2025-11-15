"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { apiClient, ApiError, CVResponse } from "@/lib/api"
import Script from "next/script"

export default function DashboardPage() {
  const [cv, setCV] = useState<CVResponse | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [widgetLoaded, setWidgetLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkOnboardingAndLoadCV()
  }, [])

  useEffect(() => {
    // Charger le script ElevenLabs et initialiser le widget
    const loadWidget = () => {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
      script.async = true
      script.onload = () => {
        console.log('ElevenLabs widget script loaded')
        setWidgetLoaded(true)
      }
      script.onerror = () => {
        console.error('Failed to load ElevenLabs widget script')
      }
      document.body.appendChild(script)

      return () => {
        // Cleanup: retirer le script lors du démontage
        const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]')
        if (existingScript) {
          document.body.removeChild(existingScript)
        }
      }
    }

    loadWidget()
  }, [])

  const checkOnboardingAndLoadCV = async () => {
    try {
      // Vérifier si l'utilisateur a complété l'onboarding
      const user = await apiClient.getCurrentUser()
      
      // Si pas de CV ou pas de photo, rediriger vers onboarding
      if (!user.cvId || !user.photoFilename) {
        router.push('/onboarding')
        return
      }

      // Charger le CV
      loadCV()
    } catch (err) {
      console.error("Error:", err)
      setIsLoading(false)
    }
  }

  const loadCV = async () => {
    try {
      setIsLoading(true)
      const cvData = await apiClient.getMyCV()
      setCV(cvData)
      setError("")
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.error || "No CV found")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    router.push("/cv/manual")
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your CV?")) {
      return
    }

    try {
      await apiClient.deleteCV()
      setCV(null)
      setError("CV deleted successfully")
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.error || "Error deleting CV")
    }
  }

  const handleLogout = () => {
    apiClient.logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center relative" style={{ backgroundImage: 'linear-gradient(rgba(229, 231, 235, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(229, 231, 235, 0.3) 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-black rounded-2xl shadow-elegant-lg">
            <div className="w-12 h-12 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative" style={{ backgroundImage: 'linear-gradient(rgba(229, 231, 235, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(229, 231, 235, 0.3) 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      {/* Floating Glass Navbar */}
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-6xl">
        <div
          className="backdrop-blur-xl bg-white/40 rounded-full border border-white/40 shadow-2xl px-6 py-3"
          style={{
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 100%)',
          }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Personal B Logo"
                className="w-16 h-16"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleEdit}
                className="h-9 rounded-full bg-black hover:bg-gray-800 transition-elegant shadow-elegant px-5 text-sm"
              >
                {cv ? "✏️ Edit" : "➕ Create CV"}
              </Button>
              <Button
                onClick={handleLogout}
                className="h-9 rounded-full text-black border border-white/60 hover:border-black transition-elegant px-5 text-sm backdrop-blur-md"
                style={{
                  background: 'rgba(255, 255, 255, 0.3)',
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
        {error && !cv && (
          <div className="bg-white rounded-3xl shadow-elegant-lg p-12 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black mb-2">No CV found</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={handleEdit}
              className="h-12 rounded-xl bg-black hover:bg-gray-800 transition-elegant shadow-elegant px-8"
            >
              Create your CV
            </Button>
          </div>
        )}

        {cv && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow-elegant p-6 border border-gray-100 hover:shadow-elegant-lg transition-elegant">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">CV Type</p>
                    <p className="text-2xl font-bold text-black capitalize">{cv.type}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-elegant p-6 border border-gray-100 hover:shadow-elegant-lg transition-elegant">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                    <p className="text-lg font-bold text-black">
                      {new Date(cv.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-elegant p-6 border border-gray-100 hover:shadow-elegant-lg transition-elegant">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Quick Actions</p>
                    <Button
                      onClick={handleDelete}
                      className="mt-2 h-9 rounded-lg bg-red-600 hover:bg-red-700 transition-elegant text-sm"
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            {cv.data && (
              <>
                <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100">
                  <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                    <span className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cv.data.name && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1 uppercase font-medium">Name</p>
                        <p className="text-black font-bold text-lg">{cv.data.name}</p>
                      </div>
                    )}
                    {cv.data.email && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1 uppercase font-medium">Email</p>
                        <p className="text-black font-medium">{cv.data.email}</p>
                      </div>
                    )}
                    {cv.data.phone && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1 uppercase font-medium">Phone</p>
                        <p className="text-black font-medium">{cv.data.phone}</p>
                      </div>
                    )}
                  </div>
                  {cv.data.summary && (
                    <div className="bg-gray-50 rounded-xl p-6 mt-6">
                      <p className="text-xs text-gray-500 mb-3 uppercase font-medium">Professional Summary</p>
                      <p className="text-black leading-relaxed">{cv.data.summary}</p>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {cv.data.skills && cv.data.skills.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                      <span className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </span>
                      Skills
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {cv.data.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium shadow-elegant hover:bg-gray-800 transition-elegant"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Passions */}
                {cv.data.passions && cv.data.passions.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100">
                    <h2 className="text-2xl font-bold text-black mb-6 flex items-center">
                      <span className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </span>
                      Passions
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {cv.data.passions.map((passion, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-gray-100 text-black rounded-xl text-sm font-medium border border-gray-300 hover:border-black transition-elegant"
                        >
                          {passion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {cv.data.experiences && cv.data.experiences.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-black border-b pb-2">
                      Work Experience
                    </h2>
                    <div className="space-y-4">
                      {cv.data.experiences.map((exp, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-black">{exp.title}</h3>
                              <p className="text-gray-700">{exp.company}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {new Date(exp.startDate).toLocaleDateString()} -{" "}
                                {exp.current
                                  ? "Present"
                                  : exp.endDate
                                  ? new Date(exp.endDate).toLocaleDateString()
                                  : "N/A"}
                              </p>
                              {exp.current && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {cv.data.education && cv.data.education.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-black border-b pb-2">Education</h2>
                    <div className="space-y-4">
                      {cv.data.education.map((edu, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-black">{edu.degree}</h3>
                              <p className="text-gray-700">{edu.school}</p>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(edu.startDate).toLocaleDateString()} -{" "}
                              {edu.endDate
                                ? new Date(edu.endDate).toLocaleDateString()
                                : "Present"}
                            </p>
                          </div>
                          {edu.description && (
                            <p className="text-gray-600 text-sm">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {cv.data.projects && cv.data.projects.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-black border-b pb-2">Projects</h2>
                    <div className="space-y-4">
                      {cv.data.projects.map((project, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <h3 className="text-lg font-semibold text-black mb-2">
                            {project.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {project.technologies.map((tech, techIndex) => (
                                <span
                                  key={techIndex}
                                  className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View Project →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ElevenLabs Coach Widget (apparaît en bas à droite) */}
      {widgetLoaded && (
        <div 
          dangerouslySetInnerHTML={{
            __html: '<elevenlabs-convai agent-id="agent_6001ka3sd553eyysf894edmrrp0j"></elevenlabs-convai>'
          }}
        />
      )}
    </div>
  )
}
